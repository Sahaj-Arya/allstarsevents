import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  eventId: String,
  title: String,
  photo: String,
  price: Number,
  date: String,
  time: String,
  location: String,
  venue: String,
  placename: String,
  seat: {
    type: String,
  },
  sessionDate: {
    type: String,
    default: "",
  },
  bookingType: {
    type: String,
    enum: ["monthly", "drop_in"],
    default: "monthly",
  },
  isScanned: {
    type: Boolean,
    default: false,
  },
  scannedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
