import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./config/db.js";
import { createRazorpay } from "./config/razorpay.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

const razorpay = createRazorpay(
  process.env.RAZORPAY_KEY_ID,
  process.env.RAZORPAY_KEY_SECRET
);

app.use("/auth", authRoutes);
app.use("/payment", paymentRoutes(razorpay));
app.use("/tickets", ticketRoutes);
app.use("/events", eventsRoutes);

export async function initApp() {
  await connectDb(process.env.MONGO_URI);
  return app;
}

export default app;
