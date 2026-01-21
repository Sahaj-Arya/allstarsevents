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

export async function listEvents(_req, res) {
  try {
    const events = await Event.find({}).sort({ date: 1, time: 1 }).lean();
    return res.json(events);
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
    if (event) return res.json(event);

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
      type: type || "event",
      isActive: typeof isActive === "boolean" ? isActive : true,
      about: normalizeAbout(about),
    });

    return res.status(201).json(event);
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
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const event = await Event.findOneAndUpdate({ $or: query }, payload, {
      new: true,
    }).lean();

    if (!event) return res.status(404).json({ error: "Event not found" });
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
