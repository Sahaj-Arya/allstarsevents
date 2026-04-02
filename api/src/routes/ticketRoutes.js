import express from "express";
import {
  getShareableTicket,
  getTickets,
  getAttendanceRoster,
  getClassAttendanceByDay,
  listAttendanceHistory,
  listTickets,
  searchTickets,
  validateTicket,
} from "../controllers/ticketController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/share/:token", getShareableTicket);
router.get("/search", searchTickets);
router.get("/list", listTickets);
router.get("/attendance", listAttendanceHistory);
router.get("/attendance-roster", getAttendanceRoster);
router.get("/attendance/classes-by-day", getClassAttendanceByDay);
router.post("/validate", validateTicket);
router.get("/", verifyAuth, getTickets);

export default router;
