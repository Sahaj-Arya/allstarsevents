import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Upload } from "../models/Upload.js";

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const resolvedUploadDir = path.resolve(uploadDir);
fs.mkdirSync(resolvedUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resolvedUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path
      .basename(file.originalname || "image", ext)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 40);
    const safeBase = base || "image";
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image uploads are allowed"));
    }
  },
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const publicBase = process.env.UPLOAD_PUBLIC_BASE || "/uploads";
    const publicUrlBase =
      process.env.UPLOAD_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const pathValue = `${publicBase}/${req.file.filename}`;
    const url = `${publicUrlBase}${pathValue}`;

    const uploadDoc = await Upload.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mime: req.file.mimetype,
      size: req.file.size,
      path: pathValue,
      url,
    });

    return res.json({
      id: uploadDoc._id,
      url: uploadDoc.url,
      path: uploadDoc.path,
      filename: uploadDoc.filename,
      size: uploadDoc.size,
      mime: uploadDoc.mime,
      createdAt: uploadDoc.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
