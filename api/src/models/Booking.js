import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    eventId: String,
    title: String,
    price: Number,
    quantity: Number,
    date: String,
    time: String,
    location: String,
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: String, required: true },
    cartItems: [cartItemSchema],
    amount: { type: Number, required: true },
    paymentMode: { type: String, enum: ["MOCK", "RAZORPAY"], default: "MOCK" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "checked-in"],
      default: "pending",
    },
    ticketToken: { type: String, required: true, unique: true },
    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
