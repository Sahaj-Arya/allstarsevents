import express from "express";
import { listEvents } from "../controllers/eventsController.js";

const router = express.Router();

router.get("/", listEvents);

export default router;
