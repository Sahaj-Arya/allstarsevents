import crypto from "crypto";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import Ticket from "../models/Ticket.js";

export function createPaymentController(razorpay) {
  return {
    createOrder: async (req, res) => {
      const { amount, userPhone, cartItems, paymentMode } = req.body;
      if (!amount) {
        return res.status(400).json({ error: "amount required" });
      }

      const phoneFromToken = req.user?.phone;
      const phone = phoneFromToken || userPhone;
      if (!phone) return res.status(400).json({ error: "user phone required" });

      const user =
        (await User.findOne({ phone })) ||
        (await User.findOneAndUpdate(
          { phone },
          { phone },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ));

      const ticketToken = crypto.randomUUID();

      // Always use Razorpay, do not allow MOCK mode

      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100),
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
        });

        // For each cart item, create as many tickets as quantity, collect ticketIds
        const { Event } = await import("../models/Event.js");
        // Step 1: Prepare ticket creation data (no booking ref yet)
        const ticketDocsToCreate = [];
        let ticketCount = 0;
        for (const item of cartItems || []) {
          const eventDoc = await Event.findOne({ id: item.eventId });
          if (!eventDoc) continue;
          for (let i = 0; i < (item.quantity || 1); i++) {
            ticketDocsToCreate.push({
              event: eventDoc._id,
              user: user._id,
              isScanned: false,
              eventId: item.eventId,
              title: item.title,
              price: item.price,
              date: item.date,
              time: item.time,
              location: item.location,
            });
            ticketCount++;
          }
        }

        if (ticketCount === 0) {
          return res
            .status(400)
            .json({ error: "No valid cart items to create booking." });
        }

        // Step 2: Create booking (no cartItems)
        const booking = await Booking.create({
          user: user._id,
          phone,
          amount,
          paymentMode: "RAZORPAY",
          status: "pending",
          ticketToken,
          razorpayOrderId: order.id,
        });

        // Step 3: Create tickets with booking ref
        for (const ticketData of ticketDocsToCreate) {
          await Ticket.create({ ...ticketData, booking: booking._id });
        }

        return res.json({ ok: true, order, booking });
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

      const secret = process.env.RAZORPAY_KEY_SECRET || "";
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = hmac.digest("hex");

      if (digest !== razorpay_signature) {
        return res.status(400).json({ error: "signature mismatch" });
      }

      const booking = await Booking.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: "paid",
          razorpayPaymentId: razorpay_payment_id,
        },
        { new: true }
      );

      if (!booking) return res.status(404).json({ error: "booking not found" });

      return res.json({ ok: true, booking });
    },
  };
}
