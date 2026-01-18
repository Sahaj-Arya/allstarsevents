import express from "express";
import {
  createEvent,
  getEventById,
  listEvents,
  updateEvent,
} from "../controllers/eventsController.js";

const router = express.Router();

router.get("/", listEvents);
router.get("/:id", getEventById);
router.post("/", createEvent);
router.put("/:id", updateEvent);

export default router;
