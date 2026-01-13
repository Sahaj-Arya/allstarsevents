import crypto from "crypto";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";

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

      if (paymentMode === "MOCK") {
        const booking = await Booking.create({
          user: user._id,
          phone,
          cartItems: cartItems || [],
          amount,
          paymentMode: "MOCK",
          status: "paid",
          ticketToken,
        });
        return res.json({ ok: true, booking });
      }

      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100),
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
        });

        const booking = await Booking.create({
          user: user._id,
          phone,
          cartItems: cartItems || [],
          amount,
          paymentMode: "RAZORPAY",
          status: "pending",
          ticketToken,
          razorpayOrderId: order.id,
        });

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
