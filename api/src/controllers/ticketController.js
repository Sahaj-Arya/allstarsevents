import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import Ticket from "../models/Ticket.js";

async function enrichBooking(booking) {
  const tickets = await Ticket.find({ booking: booking._id }).sort({
    createdAt: 1,
  });

  const ticketList = tickets.map((t) => ({
    id: t._id.toString(),
    eventId: t.eventId,
    title: t.title,
    price: t.price,
    date: t.date,
    time: t.time,
    location: t.location,
    seat: t.seat,
    isScanned: Boolean(t.isScanned),
    scannedAt: t.scannedAt,
    createdAt: t.createdAt,
  }));

  const grouped = new Map();
  for (const t of tickets) {
    const key = [t.eventId, t.title, t.price, t.date, t.time, t.location].join(
      "|"
    );

    const existing = grouped.get(key) || {
      eventId: t.eventId,
      title: t.title,
      price: t.price,
      quantity: 0,
      date: t.date,
      time: t.time,
      location: t.location,
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
        .populate("booking", "phone ticketToken"),
      Ticket.countDocuments(),
    ]);

    const payload = tickets.map((ticket) => ({
      id: ticket._id.toString(),
      eventId: ticket.eventId,
      title: ticket.title,
      date: ticket.date,
      time: ticket.time,
      location: ticket.location,
      seat: ticket.seat,
      isScanned: Boolean(ticket.isScanned),
      scannedAt: ticket.scannedAt,
      createdAt: ticket.createdAt,
      user: {
        name: ticket.user?.name || "",
        phone: ticket.user?.phone || ticket.booking?.phone || "",
      },
      bookingToken: ticket.booking?.ticketToken || "",
    }));

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
      const ticket = await Ticket.findById(normalizedToken);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      if (ticket.isScanned) {
        return res.json({ status: "already_scanned", ticket });
      }
      ticket.isScanned = true;
      ticket.scannedAt = new Date();
      await ticket.save();
      return res.json({ status: "scanned", ticket });
    }

    const booking = await Booking.findOne({ ticketToken: normalizedToken });
    if (!booking) return res.status(404).json({ error: "Ticket not found" });

    const tickets = await Ticket.find({ booking: booking._id });
    if (tickets.length === 0) {
      return res.status(404).json({ error: "No tickets for booking" });
    }

    const allScanned = tickets.every((t) => t.isScanned);
    if (allScanned) {
      return res.json({ status: "already_scanned", tickets });
    }

    await Ticket.updateMany(
      { booking: booking._id, isScanned: { $ne: true } },
      { $set: { isScanned: true, scannedAt: new Date() } }
    );

    const updated = await Ticket.find({ booking: booking._id });
    return res.json({ status: "scanned", tickets: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
