import { UserRole } from "@prisma/client";
import express, { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { enqueueTranscode, getTranscodeProgress } from "../services/transcode-queue.js";

const uploadDir = path.resolve(env.MEDIA_UPLOAD_DIR);
const uploadTempDir = path.join(uploadDir, "tmp");
const CHUNK_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(uploadTempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${uuidv4()}-${path.basename(file.originalname)}`),
});

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

const uploadVideo = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      cb(new Error("Only video files are allowed"));
      return;
    }
    cb(null, true);
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const mediaRouter = Router();
const rawChunkParser = express.raw({ type: "application/octet-stream", limit: `${CHUNK_SIZE_BYTES}b` });

mediaRouter.post(
  "/videos/sessions",
  requireAuth,
  requireRole([UserRole.VERIFIED_CREATOR, UserRole.ADMIN]),
  async (req, res) => {
    const { fileName, mimeType, totalBytes } = req.body as {
      fileName?: string;
      mimeType?: string;
      totalBytes?: number;
    };
    if (!fileName || !mimeType || !totalBytes || totalBytes <= 0) {
      return res.status(400).json({ message: "fileName, mimeType, and totalBytes are required" });
    }
    if (!mimeType.startsWith("video/")) {
      return res.status(400).json({ message: "Only video uploads are supported" });
    }
    if (totalBytes > MAX_VIDEO_BYTES) {
      return res.status(413).json({ message: "Video exceeds max allowed size" });
    }
    const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE_BYTES);
    const session = await prisma.videoUploadSession.create({
      data: {
        uploaderId: req.authUser!.id,
        fileName: path.basename(fileName),
        mimeType,
        totalBytes,
        chunkSizeBytes: CHUNK_SIZE_BYTES,
        totalChunks,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
    fs.mkdirSync(path.join(uploadTempDir, session.id), { recursive: true });
    return res.status(201).json({
      sessionId: session.id,
      chunkSizeBytes: CHUNK_SIZE_BYTES,
      totalChunks,
      expiresAt: session.expiresAt,
    });
  },
);

mediaRouter.put(
  "/videos/sessions/:sessionId/chunks/:chunkIndex",
  requireAuth,
  requireRole([UserRole.VERIFIED_CREATOR, UserRole.ADMIN]),
  rawChunkParser,
  async (req, res) => {
    const sessionId = String(req.params.sessionId);
    const chunkIndex = Number(req.params.chunkIndex);
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return res.status(400).json({ message: "Invalid chunk index" });
    }
    const session = await prisma.videoUploadSession.findUnique({ where: { id: sessionId } });
    if (!session || session.uploaderId !== req.authUser!.id) {
      return res.status(404).json({ message: "Upload session not found" });
    }
    if (session.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Upload session expired" });
    }
    if (chunkIndex >= session.totalChunks) {
      return res.status(400).json({ message: "Chunk index out of bounds" });
    }
    const body = req.body as Buffer;
    if (!body || body.length === 0) {
      return res.status(400).json({ message: "Chunk body required" });
    }

    const sessionDir = path.join(uploadTempDir, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });
    const chunkPath = path.join(sessionDir, `${chunkIndex}.part`);
    fs.writeFileSync(chunkPath, body);

    const uploadedChunks = fs.readdirSync(sessionDir).filter((file) => file.endsWith(".part")).length;
    await prisma.videoUploadSession.update({
      where: { id: sessionId },
      data: {
        status: "UPLOADING",
        uploadedChunks,
      },
    });

    return res.json({
      sessionId,
      uploadedChunks,
      totalChunks: session.totalChunks,
      progressPercent: Math.floor((uploadedChunks / session.totalChunks) * 100),
    });
  },
);

mediaRouter.post(
  "/videos/sessions/:sessionId/complete",
  requireAuth,
  requireRole([UserRole.VERIFIED_CREATOR, UserRole.ADMIN]),
  async (req, res) => {
    const sessionId = String(req.params.sessionId);
    const session = await prisma.videoUploadSession.findUnique({ where: { id: sessionId } });
    if (!session || session.uploaderId !== req.authUser!.id) {
      return res.status(404).json({ message: "Upload session not found" });
    }
    const sessionDir = path.join(uploadTempDir, sessionId);
    if (!fs.existsSync(sessionDir)) {
      return res.status(400).json({ message: "No chunks found for session" });
    }
    const chunkFiles = fs
      .readdirSync(sessionDir)
      .filter((file) => file.endsWith(".part"))
      .sort((a, b) => Number(a.split(".")[0]) - Number(b.split(".")[0]));

    if (chunkFiles.length !== session.totalChunks) {
      return res.status(400).json({
        message: "Upload incomplete",
        uploadedChunks: chunkFiles.length,
        totalChunks: session.totalChunks,
      });
    }

    await prisma.videoUploadSession.update({
      where: { id: sessionId },
      data: { status: "ASSEMBLING" },
    });

    const finalFileName = `${Date.now()}-${uuidv4()}-${session.fileName}`;
    const finalPath = path.join(uploadDir, finalFileName);
    fs.writeFileSync(finalPath, Buffer.alloc(0));
    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(sessionDir, chunkFile);
      fs.appendFileSync(finalPath, fs.readFileSync(chunkPath));
    }

    const originalUrl = `/uploads/${finalFileName}`;
    const media = await prisma.mediaAsset.create({
      data: {
        uploaderId: session.uploaderId,
        type: "VIDEO",
        originalUrl,
        playbackUrl: originalUrl,
        uploadJobStatus: "PROCESSING",
      },
    });

    await prisma.videoUploadSession.update({
      where: { id: sessionId },
      data: {
        status: "PROCESSING",
        assembledPath: finalPath,
        mediaAssetId: media.id,
      },
    });

    enqueueTranscode(media.id);

    return res.status(201).json({
      sessionId,
      mediaAssetId: media.id,
      uploadJobStatus: "PROCESSING",
      playbackUrl: media.playbackUrl,
    });
  },
);

mediaRouter.get(
  "/videos/sessions/:sessionId",
  requireAuth,
  requireRole([UserRole.VERIFIED_CREATOR, UserRole.ADMIN]),
  async (req, res) => {
    const sessionId = String(req.params.sessionId);
    const session = await prisma.videoUploadSession.findUnique({
      where: { id: sessionId },
      include: {
        mediaAsset: {
          select: {
            id: true,
            uploadJobStatus: true,
            playbackUrl: true,
            thumbnailUrl: true,
          },
        },
      },
    });
    if (!session || session.uploaderId !== req.authUser!.id) {
      return res.status(404).json({ message: "Upload session not found" });
    }
    return res.json({
      sessionId: session.id,
      status: session.status,
      uploadedChunks: session.uploadedChunks,
      totalChunks: session.totalChunks,
      progressPercent: Math.floor((session.uploadedChunks / session.totalChunks) * 100),
      media: session.mediaAsset,
      transcodeProgress: session.mediaAssetId ? getTranscodeProgress(session.mediaAssetId) : 0,
    });
  },
);

mediaRouter.post(
  "/images",
  requireAuth,
  requireRole([UserRole.VERIFIED_CREATOR, UserRole.ADMIN]),
  uploadImage.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Missing image file" });
    }
    const originalUrl = `/uploads/${req.file.filename}`;
    const media = await prisma.mediaAsset.create({
      data: {
        uploaderId: req.authUser!.id,
        type: "IMAGE",
        originalUrl,
        playbackUrl: originalUrl,
        uploadJobStatus: "READY",
      },
    });
    return res.status(201).json({
      id: media.id,
      originalUrl,
    });
  },
);

mediaRouter.post(
  "/videos",
  requireAuth,
  requireRole([UserRole.VERIFIED_CREATOR, UserRole.ADMIN]),
  uploadVideo.single("video"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Missing video file" });
    }

    const originalUrl = `/uploads/${req.file.filename}`;
    const playbackUrl = `/uploads/${req.file.filename}`;
    const thumbnailUrl = null;

    const media = await prisma.mediaAsset.create({
      data: {
        uploaderId: req.authUser!.id,
        type: "VIDEO",
        originalUrl,
        playbackUrl,
        thumbnailUrl,
        uploadJobStatus: "PROCESSING",
      },
    });

    enqueueTranscode(media.id);

    return res.status(201).json({
      id: media.id,
      uploadJobStatus: media.uploadJobStatus,
      playbackUrl,
      thumbnailUrl,
    });
  },
);
