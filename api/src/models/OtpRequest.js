import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true },
    requestId: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpRequest = mongoose.model("OtpRequest", otpSchema);
