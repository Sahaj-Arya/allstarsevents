import crypto from "crypto";
import { Booking } from "../models/Booking.js";
import Ticket from "../models/Ticket.js";
import { sendTicketViaSms } from "../utils/otp.js";

export function createPaymentController(razorpay) {
  return {
    createOrder: async (req, res) => {
      const { amount, userPhone, cartItems } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "valid amount required" });
      }

      const phoneFromToken = req.user?.phone;
      const phone = phoneFromToken || userPhone;
      if (!phone) return res.status(400).json({ error: "user phone required" });

      const normalizedCartItems =
        cartItems
          ?.map(
            ({
              eventId,
              title,
              price,
              quantity,
              date,
              time,
              location,
              venue,
              placename,
            }) => ({
              eventId,
              title,
              price,
              quantity: Math.max(1, Number(quantity) || 1),
              date,
              time,
              location,
              venue,
              placename,
            }),
          )
          .filter((item) => item.eventId) || [];

      if (normalizedCartItems.length === 0) {
        return res.status(400).json({ error: "cart items required" });
      }

      // Always use Razorpay, do not allow MOCK mode

      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100),
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
        });
        // Only return order, do not create booking yet
        return res.json({ ok: true, order });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    },

    verifyPayment: async (req, res) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "missing fields" });
      }

      const cartItems = Array.isArray(req.body.cartItems)
        ? req.body.cartItems
        : [];
      let amount = Number(req.body.amount);
      if (!amount || amount <= 0) {
        amount = cartItems.reduce(
          (sum, item) =>
            sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
          0,
        );
      }
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "valid amount required" });
      }

      if (!req.user?.id || !req.user?.phone) {
        return res.status(401).json({ error: "auth required" });
      }

      const userId = req.user.id;
      const phone = req.user.phone;

      // Validate Razorpay signature
      const secret = process.env.RAZORPAY_KEY_SECRET || "";
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = hmac.digest("hex");

      if (digest !== razorpay_signature) {
        return res.status(400).json({ error: "signature mismatch" });
      }

      const ticketToken = crypto.randomUUID();

      // Create booking only after successful payment
      try {
        const booking = await Booking.create({
          user: userId,
          phone,
          amount,
          paymentMode: "RAZORPAY",
          status: "paid",
          ticketToken,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        });

        // Create tickets
        const { Event } = await import("../models/Event.js");
        const ticketsToCreate = [];

        for (const cartItem of cartItems) {
          const eventDoc = await Event.findOne({ id: cartItem.eventId });
          if (!eventDoc) continue;
          const quantity = Math.max(1, Number(cartItem.quantity) || 1);
          const venue =
            eventDoc.venue || eventDoc.placename || eventDoc.location;
          const placename =
            eventDoc.placename || eventDoc.venue || eventDoc.location;
          const location = eventDoc.location || cartItem.location || "";
          const title = eventDoc.title || cartItem.title;
          const price = Number(eventDoc.price ?? cartItem.price ?? 0);
          const date = eventDoc.date || cartItem.date;
          const time = eventDoc.time || cartItem.time;
          for (let i = 0; i < quantity; i++) {
            ticketsToCreate.push({
              event: eventDoc._id,
              user: booking.user,
              booking: booking._id,
              eventId: cartItem.eventId,
              title,
              price,
              date,
              time,
              location,
              venue,
              placename,
            });
          }
        }

        if (ticketsToCreate.length === 0) {
          await booking.deleteOne();
          return res
            .status(400)
            .json({ error: "no valid cart items to create tickets" });
        }

        const createdTickets = await Ticket.insertMany(ticketsToCreate);
        // console.log(booking, phone, booking?.ticketToken?.toString());
        await sendTicketViaSms(phone, booking?.ticketToken?.toString());
        return res.json({ ok: true, booking, tickets: createdTickets });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
      // ...existing code...
    },
  };
}
