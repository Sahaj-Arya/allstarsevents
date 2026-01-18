import mongoose from "mongoose";
import { Event } from "../models/Event.js";

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
