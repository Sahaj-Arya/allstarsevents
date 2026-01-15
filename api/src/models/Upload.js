import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

export const Upload = mongoose.model("Upload", uploadSchema);
