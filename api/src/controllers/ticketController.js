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
