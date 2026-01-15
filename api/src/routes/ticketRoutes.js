import express from "express";
import {
  getShareableTicket,
  getTickets,
} from "../controllers/ticketController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/share/:token", getShareableTicket);
router.get("/", verifyAuth, getTickets);

export default router;
