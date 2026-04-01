import { Router } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomBytes(8).toString("hex");
    // Normalize unusual extensions to standard ones for consistent serving
    let ext = path.extname(file.originalname).toLowerCase();
    const normalizeMap: Record<string, string> = {
      ".jfif": ".jpg",
      ".heic": ".jpg",
      ".heif": ".jpg",
      ".tiff": ".tif",
    };
    if (!ext || ext === ".") ext = ".jpg";
    ext = normalizeMap[ext] || ext;
    cb(null, `${Date.now()}-${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowedExts = /\.(jpg|jpeg|png|gif|webp|svg|avif|heic|heif|bmp|tiff?)$/i;
    const allowedMimes = /^image\//i;
    if (allowedMimes.test(file.mimetype) || allowedExts.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max for videos
  fileFilter: (_req, file, cb) => {
    const allowedExts = /\.(mp4|webm|mov|avi|mkv|ogv)$/i;
    const allowedMimes = /^video\//i;
    if (allowedMimes.test(file.mimetype) || allowedExts.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

export function registerUploadRoutes(app: Router) {
  // Serve uploaded files statically
  app.use("/uploads", (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif", ".jfif", ".heic", ".heif", ".bmp", ".tif", ".tiff"];
    const videoExts = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".ogv"];
    if (!imageExts.includes(ext) && !videoExts.includes(ext)) {
      return res.status(403).send("Forbidden");
    }
    next();
  }, express.static(UPLOADS_DIR, {
    maxAge: "7d",
    immutable: true,
  }));

  // Upload single image
  app.post("/api/upload", (req, res) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("[Upload] Single upload error:", err.message);
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.filename });
    });
  });

  // Upload multiple images (max 10)
  app.post("/api/upload/multiple", (req, res) => {
    upload.array("images", 10)(req, res, (err) => {
      if (err) {
        console.error("[Upload] Multiple upload error:", err.message);
        return res.status(400).json({ error: err.message });
      }
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const results = files.map((f) => ({
        url: `/uploads/${f.filename}`,
        filename: f.filename,
      }));
      res.json({ files: results });
    });
  });

  // Upload single video (max 100MB)
  app.post("/api/upload/video", (req, res) => {
    videoUpload.single("video")(req, res, (err) => {
      if (err) {
        console.error("[Upload] Video upload error:", err.message);
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.filename });
    });
  });
}
