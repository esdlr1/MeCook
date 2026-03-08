import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const registerTokenSchema = z.object({
  token: z.string().min(16),
  platform: z.enum(["ios", "android", "web"]).default("ios"),
  deviceLabel: z.string().max(120).optional(),
});

const deleteTokenSchema = z.object({
  token: z.string().min(16),
});

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const unreadOnly = String(req.query.unreadOnly ?? "false") === "true";
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
  const skip = (page - 1) * limit;

  const where = {
    recipientId: req.authUser!.id,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        actor: { select: { id: true, displayName: true, avatarUrl: true } },
        recipe: { select: { id: true, slug: true, title: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { recipientId: req.authUser!.id, readAt: null } }),
  ]);

  return res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    unreadCount,
  });
});

notificationsRouter.post("/:id/read", async (req, res) => {
  const notificationId = String(req.params.id);
  const existing = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, recipientId: true, readAt: true },
  });
  if (!existing || existing.recipientId !== req.authUser!.id) {
    return res.status(404).json({ message: "Notification not found" });
  }
  if (existing.readAt) {
    return res.json({ ok: true, alreadyRead: true });
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
  return res.json({ ok: true });
});

notificationsRouter.post("/read-all", async (req, res) => {
  const updated = await prisma.notification.updateMany({
    where: { recipientId: req.authUser!.id, readAt: null },
    data: { readAt: new Date() },
  });
  return res.json({ ok: true, updatedCount: updated.count });
});

notificationsRouter.get("/tokens", async (req, res) => {
  const tokens = await prisma.pushToken.findMany({
    where: { userId: req.authUser!.id },
    orderBy: [{ updatedAt: "desc" }],
  });
  return res.json(tokens);
});

notificationsRouter.post("/tokens", validateBody(registerTokenSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof registerTokenSchema>;
  const token = await prisma.pushToken.upsert({
    where: { token: payload.token },
    create: {
      userId: req.authUser!.id,
      token: payload.token,
      platform: payload.platform,
      deviceLabel: payload.deviceLabel,
    },
    update: {
      userId: req.authUser!.id,
      platform: payload.platform,
      deviceLabel: payload.deviceLabel,
    },
  });
  return res.status(201).json(token);
});

notificationsRouter.delete("/tokens", validateBody(deleteTokenSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof deleteTokenSchema>;
  await prisma.pushToken.deleteMany({
    where: {
      userId: req.authUser!.id,
      token: payload.token,
    },
  });
  return res.status(204).send();
});
