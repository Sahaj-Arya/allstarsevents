import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import Ticket from "../models/Ticket.js";

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

  // For each booking, populate cartItems with their referenced tickets
  const enriched = await Promise.all(
    bookings.map(async (booking) => {
      // For each cartItem, fetch its tickets by ticketIds
      const cartItems = (booking.cartItems || []).map((ci) => ({
        ...ci.toObject(),
        ticketIds: ci.ticketIds || [],
      }));
      return {
        ...booking.toObject(),
        cartItems,
      };
    })
  );

  return res.json({ tickets: enriched });
}
