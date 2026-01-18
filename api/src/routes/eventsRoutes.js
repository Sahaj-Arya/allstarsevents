import express from "express";
import { getEventById, listEvents } from "../controllers/eventsController.js";

const router = express.Router();

router.get("/", listEvents);
router.get("/:id", getEventById);

export default router;
