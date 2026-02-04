import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import {
  generateOtpCode,
  getTestOtpConfig,
  isTestNumber,
  createOtpRequest,
  getOtpMessage,
  sendOtpViaSms,
  trackOtpSent,
  verifyOtpRequest,
} from "../utils/otp.js";

export async function sendOtp(req, res) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "phone required" });

  try {
    const code = generateOtpCode();
    const { testNumbers, testCode } = getTestOtpConfig();
    const testNumber = testNumbers.includes(phone);
    const otpToUse = testNumber ? testCode : code;

    const { requestId } = await createOtpRequest(phone, otpToUse);

    if (testNumber) {
      console.info("OTP test number; skipping SMS", { phone });
      await trackOtpSent();
      return res.json({ requestId });
    }

    const message = getOtpMessage(otpToUse);
    await sendOtpViaSms(phone, message);
    await trackOtpSent();

    return res.json({ requestId });
  } catch (err) {
    console.error("Error sending OTP:", err);
    return res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
}

export async function verifyOtp(req, res) {
  const { phone, otp, requestId, name, email } = req.body;
  const { staticOtp } = getTestOtpConfig();
  const jwtSecret = process.env.JWT_SECRET;

  if (!phone || !otp || !requestId) {
    return res.status(400).json({ error: "phone, otp, requestId required" });
  }

  if (!jwtSecret) {
    return res.status(500).json({ error: "JWT_SECRET missing" });
  }

  try {
    // Check if static OTP (for dev/test)
    if (otp === staticOtp) {
      const user = await upsertUser(phone, { name, email });
      const token = signUser(user, jwtSecret);
      return res.json({ ok: true, user, token });
    }

    // Verify OTP from database
    const verification = await verifyOtpRequest(phone, otp, requestId);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    const user = await upsertUser(phone, { name, email });
    const token = signUser(user, jwtSecret);
    return res.json({ ok: true, user, token });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to verify OTP" });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "auth required" });

    const { name, email } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;

    const user = await User.findByIdAndUpdate(userId, update, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "user not found" });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: "JWT_SECRET missing" });
    }
    const token = signUser(user, jwtSecret);
    return res.json({ ok: true, user, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUserByPhone(req, res) {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: "phone required" });
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
}

async function upsertUser(phone, { name, email }) {
  const update = { phone };
  if (name) update.name = name;
  if (email) update.email = email;
  const user = await User.findOneAndUpdate({ phone }, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
  return user;
}

function signUser(user, secret) {
  return jwt.sign(
    {
      id: user._id.toString(),
      phone: user.phone,
      name: user.name,
      email: user.email,
    },
    secret,
    { expiresIn: "7d" },
  );
}
