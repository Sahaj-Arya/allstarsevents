import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import Ticket from "../models/Ticket.js";

async function enrichBooking(booking) {
  const tickets = await Ticket.find({ booking: booking._id })
    .sort({ createdAt: 1 })
    .populate("event", "venue placename location title date time price");

  const ticketList = tickets.map((t) => {
    const venue = t.venue || t.event?.venue || t.event?.placename || t.location;
    const placename =
      t.placename || t.event?.placename || t.event?.venue || t.location;
    const location = t.location || t.event?.location || "";
    return {
      id: t._id.toString(),
      eventId: t.eventId,
      title: t.title || t.event?.title,
      price: t.price ?? t.event?.price,
      date: t.date || t.event?.date,
      time: t.time || t.event?.time,
      location,
      venue,
      placename,
      seat: t.seat,
      isScanned: Boolean(t.isScanned),
      scannedAt: t.scannedAt,
      createdAt: t.createdAt,
    };
  });

  const grouped = new Map();
  for (const t of tickets) {
    const venue = t.venue || t.event?.venue || t.event?.placename || t.location;
    const placename =
      t.placename || t.event?.placename || t.event?.venue || t.location;
    const location = t.location || t.event?.location || "";
    const title = t.title || t.event?.title;
    const price = t.price ?? t.event?.price;
    const date = t.date || t.event?.date;
    const time = t.time || t.event?.time;
    const key = [
      t.eventId,
      title,
      price,
      date,
      time,
      location,
      venue,
      placename,
    ].join("|");

    const existing = grouped.get(key) || {
      eventId: t.eventId,
      title,
      price,
      quantity: 0,
      date,
      time,
      location,
      venue,
      placename,
      ticketIds: [],
    };

    existing.quantity += 1;
    existing.ticketIds.push(t._id);
    grouped.set(key, existing);
  }

  return {
    ...booking.toObject(),
    cartItems: Array.from(grouped.values()),
    tickets: ticketList,
  };
}

export async function getTickets(req, res) {
  const userId = req.user?.id;
  const phone = req.user?.phone || req.query.phone;
  if (!userId && !phone)
    return res.status(400).json({ error: "auth required" });
  const user = userId
    ? await User.findById(userId)
    : await User.findOne({ phone });
  if (!user) return res.json({ tickets: [] });
  const bookings = await Booking.find({ user: user._id }).sort({
    createdAt: -1,
  });

  // Build cartItems from stored tickets (bookings may not persist cartItems)
  const enriched = await Promise.all(bookings.map(enrichBooking));

  return res.json({ tickets: enriched });
}

export async function getShareableTicket(req, res) {
  try {
    const token = req.params.token;

    let focusTicketId = null;

    let booking = await Booking.findOne({ ticketToken: token });

    if (!booking && token && mongoose.isValidObjectId(token)) {
      const ticket = await Ticket.findById(token);
      if (ticket?.booking) {
        booking = await Booking.findById(ticket.booking);
        focusTicketId = ticket._id.toString();
      }
    }

    if (!booking) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const enriched = await enrichBooking(booking);
    return res.json({ ticket: enriched, focusTicketId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function searchTickets(req, res) {
  try {
    const { phone, token, ticketId } = req.query;

    if (token || ticketId) {
      const lookupToken = token || ticketId;
      let focusTicketId = null;

      let booking = await Booking.findOne({ ticketToken: lookupToken });

      if (!booking && lookupToken && mongoose.isValidObjectId(lookupToken)) {
        const ticket = await Ticket.findById(lookupToken);
        if (ticket?.booking) {
          booking = await Booking.findById(ticket.booking);
          focusTicketId = ticket._id.toString();
        }
      }

      if (!booking) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      const enriched = await enrichBooking(booking);
      return res.json({ ticket: enriched, focusTicketId });
    }

    if (!phone) {
      return res.status(400).json({ error: "phone or token required" });
    }

    const bookings = await Booking.find({ phone }).sort({ createdAt: -1 });
    const enriched = await Promise.all(bookings.map(enrichBooking));
    return res.json({ tickets: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function listTickets(req, res) {
  try {
    const limitRaw = Number(req.query.limit || 200);
    const limit = Math.max(1, Math.min(limitRaw, 1000));
    const pageRaw = Number(req.query.page || 1);
    const page = Math.max(1, pageRaw);
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name phone")
        .populate("booking", "phone ticketToken")
        .populate("event", "venue placename location title date time price"),
      Ticket.countDocuments(),
    ]);

    const payload = tickets.map((ticket) => {
      const venue =
        ticket.venue ||
        ticket.event?.venue ||
        ticket.event?.placename ||
        ticket.location;
      const placename =
        ticket.placename ||
        ticket.event?.placename ||
        ticket.event?.venue ||
        ticket.location;
      const location = ticket.location || ticket.event?.location || "";
      return {
        id: ticket._id.toString(),
        eventId: ticket.eventId,
        title: ticket.title || ticket.event?.title,
        date: ticket.date || ticket.event?.date,
        time: ticket.time || ticket.event?.time,
        location,
        venue,
        placename,
        seat: ticket.seat,
        isScanned: Boolean(ticket.isScanned),
        scannedAt: ticket.scannedAt,
        createdAt: ticket.createdAt,
        user: {
          name: ticket.user?.name || "",
          phone: ticket.user?.phone || ticket.booking?.phone || "",
        },
        bookingToken: ticket.booking?.ticketToken || "",
      };
    });

    return res.json({ tickets: payload, page, limit, total });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function validateTicket(req, res) {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: "token required" });

    const normalizeToken = (value) => {
      const trimmed = String(value || "").trim();
      if (!trimmed) return "";
      try {
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          const url = new URL(trimmed);
          const byQuery =
            url.searchParams.get("token") || url.searchParams.get("id");
          if (byQuery) return byQuery;
          const match = url.pathname.match(/\/ticket\/([^/]+)$/);
          if (match?.[1]) return match[1];
          const parts = url.pathname.split("/").filter(Boolean);
          return parts[parts.length - 1] || trimmed;
        }
      } catch {
        // ignore parse errors
      }

      const pathMatch = trimmed.match(/\/ticket\/([^/?#]+)/);
      if (pathMatch?.[1]) return pathMatch[1];
      const queryMatch = trimmed.match(/[?&](token|id)=([^&]+)/);
      if (queryMatch?.[2]) return queryMatch[2];
      return trimmed;
    };

    const normalizedToken = normalizeToken(token);
    if (!normalizedToken)
      return res.status(400).json({ error: "token required" });

    if (mongoose.isValidObjectId(normalizedToken)) {
      const ticket = await Ticket.findById(normalizedToken)
        .populate("user", "name phone email")
        .populate({
          path: "booking",
          select: "phone ticketToken user",
          populate: { path: "user", select: "name phone email" },
        })
        .populate("event", "venue placename location title date time price");
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      ticket.venue =
        ticket.venue ||
        ticket.event?.venue ||
        ticket.event?.placename ||
        ticket.location;
      ticket.placename =
        ticket.placename ||
        ticket.event?.placename ||
        ticket.event?.venue ||
        ticket.location;
      ticket.location =
        ticket.location || ticket.event?.location || ticket.location;
      const userDoc = ticket.user || ticket.booking?.user;
      const user = userDoc
        ? {
            name: userDoc.name || "",
            phone: userDoc.phone || ticket.booking?.phone || "",
            email: userDoc.email || "",
          }
        : { name: "", phone: ticket.booking?.phone || "", email: "" };
      if (ticket.isScanned) {
        return res.json({ status: "already_scanned", ticket, user });
      }
      ticket.isScanned = true;
      ticket.scannedAt = new Date();
      await ticket.save();
      return res.json({ status: "scanned", ticket, user });
    }

    const booking = await Booking.findOne({ ticketToken: normalizedToken })
      .populate("user", "name phone email")
      .exec();
    if (!booking) return res.status(404).json({ error: "Ticket not found" });

    const tickets = await Ticket.find({ booking: booking._id }).populate(
      "event",
      "venue placename location title date time price",
    );
    if (tickets.length === 0) {
      return res.status(404).json({ error: "No tickets for booking" });
    }

    for (const ticket of tickets) {
      ticket.venue =
        ticket.venue ||
        ticket.event?.venue ||
        ticket.event?.placename ||
        ticket.location;
      ticket.placename =
        ticket.placename ||
        ticket.event?.placename ||
        ticket.event?.venue ||
        ticket.location;
      ticket.location =
        ticket.location || ticket.event?.location || ticket.location;
    }

    const allScanned = tickets.every((t) => t.isScanned);
    const userDoc = booking.user;
    const user = userDoc
      ? {
          name: userDoc.name || "",
          phone: userDoc.phone || "",
          email: userDoc.email || "",
        }
      : { name: "", phone: booking.phone || "", email: "" };

    if (allScanned) {
      return res.json({ status: "already_scanned", tickets, user });
    }

    await Ticket.updateMany(
      { booking: booking._id, isScanned: { $ne: true } },
      { $set: { isScanned: true, scannedAt: new Date() } },
    );

    const updated = await Ticket.find({ booking: booking._id }).populate(
      "event",
      "venue placename location title date time price",
    );
    for (const ticket of updated) {
      ticket.venue =
        ticket.venue ||
        ticket.event?.venue ||
        ticket.event?.placename ||
        ticket.location;
      ticket.placename =
        ticket.placename ||
        ticket.event?.placename ||
        ticket.event?.venue ||
        ticket.location;
      ticket.location =
        ticket.location || ticket.event?.location || ticket.location;
    }
    return res.json({ status: "scanned", tickets: updated, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
