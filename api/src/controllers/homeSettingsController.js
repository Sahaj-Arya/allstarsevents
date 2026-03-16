import { HomeSettings } from "../models/HomeSettings.js";

const DEFAULT_SETTINGS = {
  key: "home",
  heroVideoUrl:
    "https://api.prod.allstarsstudio.in/uploads/1772568700049-Video_Editing_Brighter_Colors.webm",
  heroEyebrow: "Upcoming",
  heroTitle: "Events, Workshops & Classes",
  heroDescription: "",
  heroOverlayOpacity: 70,
};

async function getOrCreateSettings() {
  let settings = await HomeSettings.findOne({ key: "home" }).lean();
  if (settings) return settings;

  const created = await HomeSettings.create(DEFAULT_SETTINGS);
  return created.toObject();
}

export async function getHomeSettings(_req, res) {
  try {
    const settings = await getOrCreateSettings();
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateHomeSettings(req, res) {
  try {
    const payload = req.body || {};

    const update = {
      heroVideoUrl:
        typeof payload.heroVideoUrl === "string"
          ? payload.heroVideoUrl.trim()
          : undefined,
      heroEyebrow:
        typeof payload.heroEyebrow === "string"
          ? payload.heroEyebrow.trim()
          : undefined,
      heroTitle:
        typeof payload.heroTitle === "string"
          ? payload.heroTitle.trim()
          : undefined,
      heroDescription:
        typeof payload.heroDescription === "string"
          ? payload.heroDescription.trim()
          : undefined,
      heroOverlayOpacity:
        payload.heroOverlayOpacity !== undefined
          ? Math.max(0, Math.min(100, Number(payload.heroOverlayOpacity) || 0))
          : undefined,
    };

    Object.keys(update).forEach((key) => {
      if (update[key] === undefined) delete update[key];
    });

    const settings = await HomeSettings.findOneAndUpdate(
      { key: "home" },
      { $set: update, $setOnInsert: DEFAULT_SETTINGS },
      { new: true, upsert: true },
    ).lean();

    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
