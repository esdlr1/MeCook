import { UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createNotificationAndDispatch } from "../services/notification-events.js";
import { moderationNotificationTemplate } from "../services/notification-templates.js";

const moderationDecisionSchema = z.object({
  approve: z.boolean(),
  moderationNotes: z.string().trim().optional(),
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole([UserRole.ADMIN]));

adminRouter.get("/moderation/recipes", async (req, res) => {
  const status = String(req.query.status ?? "PENDING").toUpperCase();
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 25), 100);
  const skip = (Math.max(page, 1) - 1) * limit;

  const where = {
    moderationStatus: status === "APPROVED" || status === "REJECTED" ? status : "PENDING",
  } as const;

  const [items, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      include: {
        author: { select: { id: true, displayName: true, email: true } },
        ingredients: { orderBy: { position: "asc" } },
        steps: { orderBy: { position: "asc" } },
      },
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.recipe.count({ where }),
  ]);

  return res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

adminRouter.post(
  "/moderation/recipes/:recipeId/decision",
  validateBody(moderationDecisionSchema),
  async (req, res) => {
    const recipeId = String(req.params.recipeId);
    const { approve, moderationNotes } = req.body;
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    const updated = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        moderationStatus: approve ? "APPROVED" : "REJECTED",
        moderationNotes,
        moderatedByUserId: req.authUser!.id,
        moderatedAt: new Date(),
        isPublished: approve,
        publishedAt: approve ? new Date() : null,
      },
    });
    await createNotificationAndDispatch(
      moderationNotificationTemplate({
        recipientId: recipe.authorId,
        actorId: req.authUser!.id,
        recipeId: recipe.id,
        recipeSlug: recipe.slug,
        recipeTitle: recipe.title,
        approved: approve,
        moderationNotes,
      }),
    );
    return res.json(updated);
  },
);
