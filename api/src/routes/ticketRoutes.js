import express from "express";
import { getTickets } from "../controllers/ticketController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyAuth, getTickets);

export default router;
