import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function verifyAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");
    if (!token) return res.status(401).json({ error: "missing token" });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "JWT secret missing" });

    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.id).lean();
    if (!user) return res.status(401).json({ error: "user not found" });

    req.user = {
      id: user._id.toString(),
      phone: user.phone,
      name: user.name,
      email: user.email,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
}
