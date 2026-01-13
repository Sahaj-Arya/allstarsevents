import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";

export async function getTickets(req, res) {
  const userId = req.user?.id;
  const phone = req.user?.phone || req.query.phone;
  if (!userId && !phone)
    return res.status(400).json({ error: "auth required" });
  const user = userId
    ? await User.findById(userId)
    : await User.findOne({ phone });
  if (!user) return res.json({ tickets: [] });
  const tickets = await Booking.find({ user: user._id }).sort({
    createdAt: -1,
  });
  return res.json({ tickets });
}
