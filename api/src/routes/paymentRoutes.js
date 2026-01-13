import express from "express";
import { createPaymentController } from "../controllers/paymentController.js";
import { verifyAuth } from "../middleware/auth.js";

export default function paymentRoutes(razorpay) {
  const router = express.Router();
  const controller = createPaymentController(razorpay);

  router.use(verifyAuth);
  router.post("/create-order", controller.createOrder);
  router.post("/verify", controller.verifyPayment);

  return router;
}
