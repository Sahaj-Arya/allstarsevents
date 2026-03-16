import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      unique: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    eventId: { type: String, default: "" },
    eventTitle: { type: String, default: "" },
    eventType: {
      type: String,
      enum: ["event", "workshop", "class"],
      default: "event",
    },
    bookingType: {
      type: String,
      enum: ["monthly", "drop_in"],
      default: "monthly",
    },
    sessionDate: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    userName: { type: String, default: "" },
    userPhone: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    bookingToken: { type: String, default: "" },
    scannedAt: { type: Date, required: true },
    scanCategory: { type: String, default: "any" },
    scanSource: {
      type: String,
      enum: ["ticket_id", "booking_token"],
      default: "ticket_id",
    },
  },
  { timestamps: true },
);

attendanceSchema.index({ eventId: 1, sessionDate: 1, scannedAt: -1 });
attendanceSchema.index({ userPhone: 1, scannedAt: -1 });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
