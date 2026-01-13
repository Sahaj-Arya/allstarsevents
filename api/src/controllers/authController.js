import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { OtpRequest } from "../models/OtpRequest.js";
import { User } from "../models/User.js";

const OTP_TTL_MS = 5 * 60 * 1000;

export async function sendOtp(req, res) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "phone required" });

  const requestId = uuidv4();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await OtpRequest.create({ phone, code, requestId, expiresAt });
  console.info("OTP (dev)", { phone, code });

  return res.json({ requestId });
}

export async function verifyOtp(req, res) {
  const { phone, otp, requestId, name, email } = req.body;
  const staticOtp = process.env.STATIC_OTP || "000000";
  const jwtSecret = process.env.JWT_SECRET;

  if (!phone || !otp || !requestId) {
    return res.status(400).json({ error: "phone, otp, requestId required" });
  }

  if (!jwtSecret) {
    return res.status(500).json({ error: "JWT_SECRET missing" });
  }

  if (otp === staticOtp) {
    // Allow static OTP for dev/test, but do not bypass on any flag
    const user = await upsertUser(phone, { name, email });
    const token = signUser(user, jwtSecret);
    return res.json({ ok: true, user, token });
  }

  const found = await OtpRequest.findOne({ requestId, phone, consumed: false });
  if (!found) return res.status(400).json({ error: "invalid" });
  if (found.expiresAt < new Date())
    return res.status(400).json({ error: "expired" });
  if (found.code !== otp) return res.status(400).json({ error: "incorrect" });

  found.consumed = true;
  await found.save();

  const user = await upsertUser(phone, { name, email });
  const token = signUser(user, jwtSecret);
  return res.json({ ok: true, user, token });
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
    { expiresIn: "7d" }
  );
}
