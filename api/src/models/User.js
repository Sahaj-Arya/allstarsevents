import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
