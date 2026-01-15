import mongoose from "mongoose";

const statsSchema = new mongoose.Schema(
  {
    otpSent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Stats = mongoose.model("Stats", statsSchema);
