import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { createNotificationAndDispatch } from "../services/notification-events.js";
import { followNotificationTemplate } from "../services/notification-templates.js";

export const socialRouter = Router();

socialRouter.post("/creators/:creatorId/follow/toggle", requireAuth, async (req, res) => {
  const creatorId = String(req.params.creatorId);
  const followerId = req.authUser!.id;
  if (creatorId === followerId) {
    return res.status(400).json({ message: "Cannot follow yourself" });
  }

  const existing = await prisma.creatorFollow.findUnique({
    where: { creatorId_followerId: { creatorId, followerId } },
  });
  if (existing) {
    await prisma.creatorFollow.delete({
      where: { creatorId_followerId: { creatorId, followerId } },
    });
    return res.json({ following: false });
  }

  await prisma.creatorFollow.create({
    data: { creatorId, followerId },
  });
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    select: { displayName: true },
  });
  await createNotificationAndDispatch(
    followNotificationTemplate({
      recipientId: creatorId,
      actorId: followerId,
      actorDisplayName: follower?.displayName ?? "Someone",
    }),
  );
  return res.json({ following: true });
});

socialRouter.get("/recipes/:slug/share", async (req, res) => {
  const slug = String(req.params.slug);
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    include: { author: { select: { displayName: true } } },
  });
  if (!recipe || !recipe.isPublished || recipe.moderationStatus !== "APPROVED" || recipe.visibility !== "PUBLIC") {
    return res.status(404).json({ message: "Recipe not found" });
  }
  const canonicalUrl = `${env.APP_BASE_URL}/recipe/${recipe.slug}`;
  const deepLinkUrl = `mecook://recipe/${recipe.slug}`;
  return res.json({
    title: recipe.title,
    author: recipe.author.displayName,
    canonicalUrl,
    deepLinkUrl,
    message: `Try "${recipe.title}" by ${recipe.author.displayName} on MeCook`,
  });
});
