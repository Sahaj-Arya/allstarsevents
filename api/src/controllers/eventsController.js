import mongoose from "mongoose";
import { Event } from "../models/Event.js";

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeAbout = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
};

const normalizeEventType = (value) => {
  if (value === "class") return "class";
  if (value === "workshop") return "workshop";
  return "event";
};

const parseObjectValue = (value) => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_err) {
      return {};
    }
  }
  if (typeof value === "object") return value;
  return {};
};

const normalizeRepeat = (eventType, value) => {
  if (eventType !== "class") {
    return {
      enabled: false,
      frequency: "none",
      interval: 1,
      until: "",
      occurrences: null,
    };
  }

  const raw = parseObjectValue(value);
  const enabled = Boolean(raw.enabled);
  const validFrequencies = new Set(["daily", "weekly", "monthly"]);
  const frequency = enabled
    ? validFrequencies.has(raw.frequency)
      ? raw.frequency
      : "weekly"
    : "none";
  const interval = Math.max(1, Number(raw.interval) || 1);
  const until = enabled && typeof raw.until === "string" ? raw.until : "";
  const occurrencesRaw = Number(raw.occurrences);
  const occurrences =
    enabled && Number.isFinite(occurrencesRaw) && occurrencesRaw >= 1
      ? Math.floor(occurrencesRaw)
      : null;

  return {
    enabled,
    frequency,
    interval,
    until,
    occurrences,
  };
};

const normalizeEventOutput = (event) => ({
  ...event,
  type: normalizeEventType(event?.type),
  repeat: normalizeRepeat(normalizeEventType(event?.type), event?.repeat),
});

export async function listEvents(_req, res) {
  try {
    const events = await Event.find({}).sort({ date: 1, time: 1 }).lean();
    return res.json(events.map(normalizeEventOutput));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const query = [{ id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id });
    }
    const event = await Event.findOne({ $or: query }).lean();
    if (event) return res.json(normalizeEventOutput(event));

    return res.status(404).json({ error: "Event not found" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createEvent(req, res) {
  try {
    const {
      id,
      title,
      description,
      price,
      original_price,
      photo,
      images,
      media,
      placename,
      venue,
      category,
      date,
      time,
      location,
      type,
      repeat,
      isActive,
      about,
    } = req.body || {};

    if (!id || !title || !price || !date || !time || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const event = await Event.create({
      id,
      title,
      description: description || "",
      price: Number(price),
      original_price:
        original_price !== undefined && original_price !== null
          ? Number(original_price)
          : null,
      photo: photo || "",
      images: toArray(images),
      media: toArray(media),
      placename: placename || "",
      venue: venue || "",
      category: category || "",
      date,
      time,
      location,
      type: normalizeEventType(type),
      repeat: normalizeRepeat(normalizeEventType(type), repeat),
      isActive: typeof isActive === "boolean" ? isActive : true,
      about: normalizeAbout(about),
    });

    return res.status(201).json(normalizeEventOutput(event.toObject()));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const update = req.body || {};
    const query = [{ id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id });
    }

    const payload = {
      ...update,
      price: update.price !== undefined ? Number(update.price) : undefined,
      original_price:
        update.original_price !== undefined
          ? Number(update.original_price)
          : undefined,
      images: update.images !== undefined ? toArray(update.images) : undefined,
      media: update.media !== undefined ? toArray(update.media) : undefined,
      about:
        update.about !== undefined ? normalizeAbout(update.about) : undefined,
      type: update.type !== undefined ? normalizeEventType(update.type) : undefined,
    };

    const effectiveType = payload.type || undefined;
    const typeForRepeat = effectiveType
      ? normalizeEventType(effectiveType)
      : undefined;
    if (update.repeat !== undefined || typeForRepeat !== undefined) {
      let currentType = typeForRepeat;
      if (!currentType) {
        const currentEvent = await Event.findOne({ $or: query })
          .select("type repeat")
          .lean();
        if (!currentEvent)
          return res.status(404).json({ error: "Event not found" });
        currentType = normalizeEventType(currentEvent.type);
        payload.repeat = normalizeRepeat(currentType, update.repeat);
      } else {
        payload.repeat = normalizeRepeat(currentType, update.repeat);
      }
    }

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const event = await Event.findOneAndUpdate({ $or: query }, payload, {
      new: true,
    }).lean();

    if (!event) return res.status(404).json({ error: "Event not found" });
    return res.json(normalizeEventOutput(event));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
