import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { Attendance } from "../models/Attendance.js";
import Ticket from "../models/Ticket.js";

function normalizeTicketToken(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // ignore malformed URI sequences
  }

  return decoded.replace(/^\{+|\}+$/g, "").trim();
}

async function logAttendance({
  ticket,
  booking,
  user,
  scanCategory,
  scanSource,
}) {
  if (!ticket?._id || !ticket?.event || !ticket?.user || !ticket?.booking) {
    return;
  }

  const eventType = ticket?.event?.type || "event";
  const bookingType = ticket?.bookingType || "monthly";
  const sessionDate = ticket?.sessionDate || ticket?.date || "";

  await Attendance.findOneAndUpdate(
    { ticket: ticket._id },
    {
      $setOnInsert: {
        ticket: ticket._id,
        booking: ticket.booking,
        user: ticket.user,
        event: ticket.event?._id || ticket.event,
        eventId: ticket.eventId || ticket.event?.id || "",
        eventTitle: ticket.title || ticket.event?.title || "",
        eventType,
        bookingType,
        sessionDate,
        date: ticket.date || ticket.event?.date || "",
        time: ticket.time || ticket.event?.time || "",
        userName: user?.name || "",
        userPhone: user?.phone || booking?.phone || "",
        userEmail: user?.email || "",
        bookingToken: booking?.ticketToken || "",
        scannedAt: ticket.scannedAt || new Date(),
        scanCategory: scanCategory || "any",
        scanSource,
      },
    },
    { upsert: true },
  ).lean();
}

async function enrichBooking(booking) {
  const tickets = await Ticket.find({ booking: booking._id })
    .sort({ createdAt: 1 })
    .populate("event", "venue placename location title date time price photo");

  const ticketList = tickets.map((t) => {
    const venue = t.venue || t.event?.venue || t.event?.placename || t.location;
    const placename =
      t.placename || t.event?.placename || t.event?.venue || t.location;
    const location = t.location || t.event?.location || "";
    return {
      id: t._id.toString(),
      eventId: t.eventId,
      title: t.title || t.event?.title,
      photo: t.photo || t.event?.photo || "",
      price: t.price ?? t.event?.price,
      date: t.date || t.event?.date,
      time: t.time || t.event?.time,
      location,
      venue,
      placename,
      seat: t.seat,
      sessionDate: t.sessionDate || "",
      bookingType: t.bookingType || "monthly",
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
    const photo = t.photo || t.event?.photo || "";
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
      t.sessionDate || "",
      t.bookingType || "monthly",
    ].join("|");

    const existing = grouped.get(key) || {
      eventId: t.eventId,
      title,
      photo,
      price,
      quantity: 0,
      date,
      time,
      location,
      venue,
      placename,
      sessionDate: t.sessionDate || "",
      bookingType: t.bookingType || "monthly",
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
    const token = normalizeTicketToken(req.params.token);

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
      const lookupToken = normalizeTicketToken(token || ticketId);
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
    const eventId = String(req.query.eventId || "").trim();
    const filters = {};
    if (eventId) {
      filters.eventId = eventId;
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name phone")
        .populate("booking", "phone ticketToken")
        .populate(
          "event",
          "venue placename location title date time price photo",
        ),
      Ticket.countDocuments(filters),
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
        sessionDate: ticket.sessionDate || "",
        bookingType: ticket.bookingType || "monthly",
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

export async function listAttendanceHistory(req, res) {
  try {
    const limitRaw = Number(req.query.limit || 200);
    const limit = Math.max(1, Math.min(limitRaw, 1000));
    const pageRaw = Number(req.query.page || 1);
    const page = Math.max(1, pageRaw);
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.eventId) {
      filters.eventId = String(req.query.eventId);
    }
    if (req.query.eventType) {
      filters.eventType = String(req.query.eventType);
    }
    if (req.query.bookingType) {
      filters.bookingType = String(req.query.bookingType);
    }
    if (req.query.sessionDate) {
      filters.sessionDate = String(req.query.sessionDate);
    }
    if (req.query.userPhone) {
      filters.userPhone = String(req.query.userPhone);
    }

    const [records, total] = await Promise.all([
      Attendance.find(filters)
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filters),
    ]);

    const payload = records.map((record) => ({
      id: record._id.toString(),
      ticketId: record.ticket?.toString?.() || String(record.ticket || ""),
      bookingToken: record.bookingToken || "",
      eventId: record.eventId || "",
      eventTitle: record.eventTitle || "",
      eventType: record.eventType || "event",
      bookingType: record.bookingType || "monthly",
      sessionDate: record.sessionDate || "",
      date: record.date || "",
      time: record.time || "",
      userName: record.userName || "",
      userPhone: record.userPhone || "",
      userEmail: record.userEmail || "",
      scannedAt: record.scannedAt,
      scanCategory: record.scanCategory || "any",
      scanSource: record.scanSource || "ticket_id",
      createdAt: record.createdAt,
    }));

    return res.json({ records: payload, page, limit, total });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAttendanceRoster(req, res) {
  try {
    const eventId = String(req.query.eventId || "").trim();
    const sessionDate = String(req.query.sessionDate || "").trim();
    const bookingType = String(req.query.bookingType || "").trim();

    if (!eventId) {
      return res.status(400).json({ error: "eventId required" });
    }

    const filters = { eventId };
    if (sessionDate) filters.sessionDate = sessionDate;
    if (bookingType === "monthly" || bookingType === "drop_in") {
      filters.bookingType = bookingType;
    }

    const tickets = await Ticket.find(filters)
      .sort({ date: 1, createdAt: 1 })
      .populate("user", "name phone email")
      .populate("booking", "phone ticketToken")
      .populate("event", "id title type date time");

    const rows = tickets.map((ticket) => {
      const userName = ticket.user?.name || "";
      const userPhone = ticket.user?.phone || ticket.booking?.phone || "";
      const userEmail = ticket.user?.email || "";
      return {
        ticketId: ticket._id.toString(),
        bookingToken: ticket.booking?.ticketToken || "",
        eventId: ticket.eventId || ticket.event?.id || "",
        eventTitle: ticket.title || ticket.event?.title || "",
        eventType: ticket.event?.type || "event",
        bookingType: ticket.bookingType || "monthly",
        sessionDate: ticket.sessionDate || ticket.date || "",
        time: ticket.time || ticket.event?.time || "",
        userName,
        userPhone,
        userEmail,
        status: ticket.isScanned ? "present" : "absent",
        scannedAt: ticket.scannedAt,
      };
    });

    const presentCount = rows.filter((row) => row.status === "present").length;
    const absentCount = rows.length - presentCount;

    return res.json({
      eventId,
      sessionDate,
      total: rows.length,
      presentCount,
      absentCount,
      rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function toYyyyMmDd(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getClassAttendanceByDay(req, res) {
  try {
    const requestedDate = String(req.query.date || "").trim();
    const day = requestedDate || toYyyyMmDd();
    const today = toYyyyMmDd();

    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return res
        .status(400)
        .json({ error: "valid date required (YYYY-MM-DD)" });
    }
    if (day > today) {
      return res
        .status(400)
        .json({ error: "date must be today or in the past" });
    }

    const tickets = await Ticket.find({
      $or: [{ sessionDate: day }, { date: day }],
    })
      .populate("user", "name phone email")
      .populate("booking", "phone ticketToken")
      .populate("event", "id title type time")
      .sort({ time: 1, createdAt: 1 });

    const classTickets = tickets.filter(
      (ticket) => ticket.event?.type === "class",
    );
    const grouped = new Map();

    for (const ticket of classTickets) {
      const eventId = ticket.eventId || ticket.event?.id || "";
      const sessionDate = ticket.sessionDate || ticket.date || day;
      const key = `${eventId}|${sessionDate}`;
      const existing = grouped.get(key) || {
        eventId,
        eventTitle: ticket.title || ticket.event?.title || "",
        sessionDate,
        time: ticket.time || ticket.event?.time || "",
        total: 0,
        present: 0,
        absent: 0,
        dropInTotal: 0,
        dropInPresent: 0,
        dropInAbsent: 0,
        monthlyTotal: 0,
        monthlyPresent: 0,
        monthlyAbsent: 0,
        attendees: [],
      };

      const isDropIn = ticket.bookingType === "drop_in";
      const isPresent = Boolean(ticket.isScanned);
      const attendee = {
        ticketId: ticket._id.toString(),
        userName: ticket.user?.name || "",
        userPhone: ticket.user?.phone || ticket.booking?.phone || "",
        userEmail: ticket.user?.email || "",
        bookingType: isDropIn ? "drop_in" : "monthly",
        status: isPresent ? "present" : "absent",
        scannedAt: ticket.scannedAt,
      };

      existing.total += 1;
      if (isPresent) {
        existing.present += 1;
      } else {
        existing.absent += 1;
      }

      if (isDropIn) {
        existing.dropInTotal += 1;
        if (isPresent) existing.dropInPresent += 1;
        else existing.dropInAbsent += 1;
      } else {
        existing.monthlyTotal += 1;
        if (isPresent) existing.monthlyPresent += 1;
        else existing.monthlyAbsent += 1;
      }

      existing.attendees.push(attendee);
      grouped.set(key, existing);
    }

    const sessions = Array.from(grouped.values()).map((session) => ({
      ...session,
      absentUsers: session.attendees.filter((a) => a.status === "absent"),
    }));

    sessions.sort((a, b) => {
      const aTime = String(a.time || "");
      const bTime = String(b.time || "");
      return aTime.localeCompare(bTime);
    });

    const totals = sessions.reduce(
      (acc, session) => {
        acc.total += session.total;
        acc.present += session.present;
        acc.absent += session.absent;
        acc.dropInTotal += session.dropInTotal;
        acc.dropInPresent += session.dropInPresent;
        acc.dropInAbsent += session.dropInAbsent;
        return acc;
      },
      {
        total: 0,
        present: 0,
        absent: 0,
        dropInTotal: 0,
        dropInPresent: 0,
        dropInAbsent: 0,
      },
    );

    return res.json({
      day,
      sessionCount: sessions.length,
      totals,
      sessions,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function validateTicket(req, res) {
  try {
    const { token, scanCategory, targetEventId, targetSessionDate } =
      req.body || {};
    if (!token) return res.status(400).json({ error: "token required" });

    const allowedCategories = new Set([
      "any",
      "event",
      "workshop",
      "class",
      "drop_in_class",
    ]);
    const category = allowedCategories.has(scanCategory) ? scanCategory : "any";
    const normalizedTargetEventId = String(targetEventId || "").trim();
    const normalizedTargetSessionDate = String(targetSessionDate || "").trim();

    if (category === "drop_in_class" && !normalizedTargetSessionDate) {
      return res
        .status(400)
        .json({ error: "targetSessionDate required for drop-in class scan" });
    }

    const isTicketInCategory = (ticket) => {
      if (category === "any") return true;
      const eventType = ticket?.event?.type || "event";
      const bookingType = ticket?.bookingType || "monthly";
      if (category === "drop_in_class") {
        return eventType === "class" && bookingType === "drop_in";
      }
      if (category === "class") {
        return eventType === "class" && bookingType !== "drop_in";
      }
      return eventType === category;
    };

    const isTicketForTarget = (ticket) => {
      if (!normalizedTargetEventId) return true;
      const ticketEventId = String(ticket?.eventId || ticket?.event?.id || "");
      return ticketEventId === normalizedTargetEventId;
    };

    const isTicketForSession = (ticket) => {
      if (!normalizedTargetSessionDate) return true;
      const session = String(ticket?.sessionDate || ticket?.date || "").trim();
      return session === normalizedTargetSessionDate;
    };

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

    const normalizedToken = normalizeTicketToken(normalizeToken(token));
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
        .populate(
          "event",
          "id venue placename location title date time price photo type",
        );
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      if (!isTicketInCategory(ticket)) {
        return res.status(400).json({
          error: `This ticket is not a ${category.replace("_", " ")}`,
        });
      }

      if (!isTicketForTarget(ticket)) {
        return res.status(400).json({
          error: `This ticket is not for event ${normalizedTargetEventId}`,
        });
      }

      if (!isTicketForSession(ticket)) {
        return res.status(400).json({
          error: `This ticket is not valid for session ${normalizedTargetSessionDate}`,
        });
      }

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

      await logAttendance({
        ticket,
        booking: ticket.booking,
        user,
        scanCategory: category,
        scanSource: "ticket_id",
      });

      return res.json({ status: "scanned", ticket, user });
    }

    const booking = await Booking.findOne({ ticketToken: normalizedToken })
      .populate("user", "name phone email")
      .exec();
    if (!booking) return res.status(404).json({ error: "Ticket not found" });

    const tickets = await Ticket.find({ booking: booking._id }).populate(
      "event",
      "id venue placename location title date time price photo type",
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

    const matchingTickets = tickets.filter(
      (t) =>
        isTicketInCategory(t) && isTicketForTarget(t) && isTicketForSession(t),
    );
    if (matchingTickets.length === 0) {
      if (normalizedTargetSessionDate) {
        return res.status(400).json({
          error: `No tickets found for session ${normalizedTargetSessionDate} in this booking`,
        });
      }
      if (normalizedTargetEventId) {
        return res.status(400).json({
          error: `No tickets found for event ${normalizedTargetEventId} in this booking`,
        });
      }
      return res.status(400).json({
        error:
          category === "any"
            ? "No tickets found in this booking"
            : `No ${category.replace("_", " ")} tickets found in this booking`,
      });
    }

    const pendingMatching = matchingTickets.filter((t) => !t.isScanned);
    const userDoc = booking.user;
    const user = userDoc
      ? {
          name: userDoc.name || "",
          phone: userDoc.phone || "",
          email: userDoc.email || "",
        }
      : { name: "", phone: booking.phone || "", email: "" };

    if (pendingMatching.length === 0) {
      return res.json({
        status: "already_scanned",
        tickets: matchingTickets,
        user,
      });
    }

    // Scan one matching pending ticket at a time so attendance stays per-class/per-seat accurate.
    const ticketToScan = pendingMatching.sort(
      (a, b) =>
        new Date(a.date || a.createdAt || 0).getTime() -
        new Date(b.date || b.createdAt || 0).getTime(),
    )[0];
    ticketToScan.isScanned = true;
    ticketToScan.scannedAt = new Date();
    await ticketToScan.save();

    await logAttendance({
      ticket: ticketToScan,
      booking,
      user,
      scanCategory: category,
      scanSource: "booking_token",
    });

    const updatedMatching = await Ticket.find({
      booking: booking._id,
      _id: { $in: matchingTickets.map((t) => t._id) },
    }).populate(
      "event",
      "id venue placename location title date time price photo type",
    );

    for (const ticket of updatedMatching) {
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
    return res.json({ status: "scanned", tickets: updatedMatching, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
