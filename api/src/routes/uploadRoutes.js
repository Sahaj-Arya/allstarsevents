import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Upload } from "../models/Upload.js";

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const resolvedUploadDir = path.isAbsolute(uploadDir)
  ? uploadDir
  : path.resolve(process.cwd(), uploadDir);
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
  limits: { fileSize: 10 * 1024 * 1024 },
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
    console.log("[UPLOAD] Incoming upload request");
    if (!req.file) {
      console.warn("[UPLOAD] No file received");
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("[UPLOAD] File received:", {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
    });

    const publicBaseRaw = process.env.UPLOAD_PUBLIC_BASE || "/uploads";
    const publicBase =
      publicBaseRaw.startsWith("/") && !publicBaseRaw.includes("..")
        ? publicBaseRaw
        : "/uploads";
    const publicUrlBase =
      process.env.UPLOAD_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    // Always expose /uploads/filename as the public URL, regardless of storage location
    const pathValue = `${publicBase}/${req.file.filename}`;
    // Ensure no accidental path traversal in URL
    const url = `${publicUrlBase.replace(/\/$/, "")}${publicBase}/$${
      req.file.filename
    }`;

    console.log("[UPLOAD] Saving upload doc to DB", {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mime: req.file.mimetype,
      size: req.file.size,
      path: pathValue,
      url,
    });

    const uploadDoc = await Upload.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mime: req.file.mimetype,
      size: req.file.size,
      path: pathValue,
      url,
    });

    console.log("[UPLOAD] Upload saved", {
      id: uploadDoc._id,
      url: uploadDoc.url,
      path: uploadDoc.path,
      filename: uploadDoc.filename,
      size: uploadDoc.size,
      mime: uploadDoc.mime,
      createdAt: uploadDoc.createdAt,
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
    console.error("[UPLOAD] Error during upload:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
