import mongoose from "mongoose";

const homeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "home" },
    heroVideoUrl: { type: String, default: "" },
    heroEyebrow: { type: String, default: "Upcoming" },
    heroTitle: {
      type: String,
      default: "Events, Workshops & Classes",
    },
    heroDescription: { type: String, default: "" },
    heroOverlayOpacity: { type: Number, min: 0, max: 100, default: 70 },
  },
  { timestamps: true },
);

export const HomeSettings = mongoose.model("HomeSettings", homeSettingsSchema);
