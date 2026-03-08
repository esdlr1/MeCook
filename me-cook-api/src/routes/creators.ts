import { Prisma, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const reviewSchema = z.object({
  userId: z.string().cuid(),
  approve: z.boolean(),
  reviewNotes: z.string().optional(),
});

export const creatorsRouter = Router();

creatorsRouter.post("/me/apply", requireAuth, async (req, res) => {
  const profile = await prisma.creatorProfile.upsert({
    where: { userId: req.authUser!.id },
    create: {
      userId: req.authUser!.id,
      moderationStatus: "PENDING",
      canPublish: false,
    },
    update: {
      moderationStatus: "PENDING",
      canPublish: false,
      reviewNotes: null,
      reviewedAt: null,
      reviewedByUserId: null,
    },
  });
  await prisma.user.update({
    where: { id: req.authUser!.id },
    data: { role: UserRole.USER },
  });
  return res.status(202).json(profile);
});

creatorsRouter.get("/me/status", requireAuth, async (req, res) => {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: req.authUser!.id },
    select: {
      moderationStatus: true,
      canPublish: true,
      reviewedAt: true,
      reviewNotes: true,
    },
  });
  return res.json({
    role: req.authUser!.role,
    creatorProfile: profile,
  });
});

creatorsRouter.get("/top", async (_req, res) => {
  const creators = await prisma.user.findMany({
    where: {
      role: UserRole.VERIFIED_CREATOR,
      isActive: true,
    },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      _count: {
        select: {
          recipes: true,
          followers: true,
        },
      },
    },
    take: 50,
  });
  return res.json(creators);
});

creatorsRouter.post(
  "/review",
  requireAuth,
  requireRole([UserRole.ADMIN]),
  validateBody(reviewSchema),
  async (req, res) => {
    const { userId, approve, reviewNotes } = req.body;

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const creatorProfile = await tx.creatorProfile.upsert({
        where: { userId },
        create: {
          userId,
          moderationStatus: approve ? "APPROVED" : "REJECTED",
          canPublish: approve,
          reviewedByUserId: req.authUser!.id,
          reviewNotes,
          reviewedAt: new Date(),
        },
        update: {
          moderationStatus: approve ? "APPROVED" : "REJECTED",
          canPublish: approve,
          reviewedByUserId: req.authUser!.id,
          reviewNotes,
          reviewedAt: new Date(),
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          role: approve ? UserRole.VERIFIED_CREATOR : UserRole.USER,
        },
      });

      return { creatorProfile, user };
    });

    return res.json(updated);
  },
);
