import express from "express";
import {
  sendOtp,
  verifyOtp,
  updateProfile,
  getUserByPhone,
} from "../controllers/authController.js";
import { verifyAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.put("/profile", verifyAuth, updateProfile);
router.get("/user-by-phone", getUserByPhone);

export default router;
