import express from "express";
import { createPaymentController } from "../controllers/paymentController.js";
import { verifyAuth } from "../middleware/auth.js";

export default function paymentRoutes(razorpay) {
  const router = express.Router();
  const controller = createPaymentController(razorpay);

  // Webhook endpoint - MUST be before verifyAuth middleware
  // Razorpay uses signature verification, not JWT
  router.post("/webhook", (req, _res, next) => {
    console.log("🔔 Webhook hit", {
      hasSignature: Boolean(req.headers["x-razorpay-signature"]),
      contentType: req.headers["content-type"],
    });
    next();
  }, controller.handleWebhook);

  router.use(verifyAuth);
  router.post("/create-order", controller.createOrder);
  router.post("/verify", controller.verifyPayment);

  return router;
}
