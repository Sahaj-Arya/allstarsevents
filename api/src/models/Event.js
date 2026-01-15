import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    photo: { type: String, default: "" },
    placename: { type: String, default: "" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, enum: ["event", "class"], default: "event" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
