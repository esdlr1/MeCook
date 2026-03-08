import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

const onboardingSchema = z.object({
  countryCode: z.string().trim().min(2).max(3),
  preferredCuisines: z.array(z.string().trim().min(2).max(40)).min(1).max(10),
  bio: z.string().trim().max(300).optional(),
});

const notificationPreferencesSchema = z.object({
  notifyCommentPush: z.boolean(),
  notifyFollowPush: z.boolean(),
  notifyModerationPush: z.boolean(),
});

usersRouter.get("/me/preferences", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.authUser!.id },
    select: {
      countryCode: true,
      preferredCuisines: true,
      onboardingCompleted: true,
      bio: true,
    },
  });
  return res.json(user);
});

usersRouter.get("/me/notification-preferences", async (req, res) => {
  const prefs = await prisma.user.findUnique({
    where: { id: req.authUser!.id },
    select: {
      notifyCommentPush: true,
      notifyFollowPush: true,
      notifyModerationPush: true,
    },
  });
  return res.json(prefs);
});

usersRouter.put("/me/notification-preferences", validateBody(notificationPreferencesSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof notificationPreferencesSchema>;
  const prefs = await prisma.user.update({
    where: { id: req.authUser!.id },
    data: {
      notifyCommentPush: payload.notifyCommentPush,
      notifyFollowPush: payload.notifyFollowPush,
      notifyModerationPush: payload.notifyModerationPush,
    },
    select: {
      notifyCommentPush: true,
      notifyFollowPush: true,
      notifyModerationPush: true,
    },
  });
  return res.json(prefs);
});

usersRouter.put("/me/preferences", validateBody(onboardingSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof onboardingSchema>;
  const user = await prisma.user.update({
    where: { id: req.authUser!.id },
    data: {
      countryCode: payload.countryCode.toUpperCase(),
      preferredCuisines: payload.preferredCuisines,
      bio: payload.bio,
      onboardingCompleted: true,
    },
    select: {
      id: true,
      countryCode: true,
      preferredCuisines: true,
      onboardingCompleted: true,
      bio: true,
    },
  });
  return res.json(user);
});

usersRouter.get("/me/saved", async (req, res) => {
  const items = await prisma.savedRecipe.findMany({
    where: { userId: req.authUser!.id },
    include: {
      recipe: {
        include: {
          author: { select: { id: true, displayName: true, avatarUrl: true } },
          tags: true,
          _count: { select: { reactions: true, comments: true, saves: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return res.json(
    items
      .filter(
        (item) =>
          item.recipe.isPublished &&
          item.recipe.visibility === "PUBLIC" &&
          item.recipe.moderationStatus === "APPROVED",
      )
      .map((item) => item.recipe),
  );
});

usersRouter.get("/me/recipes", async (req, res) => {
  const recipes = await prisma.recipe.findMany({
    where: { authorId: req.authUser!.id },
    include: {
      ingredients: { orderBy: { position: "asc" } },
      steps: { orderBy: { position: "asc" } },
      tags: true,
      _count: { select: { comments: true, reactions: true, saves: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
  });
  return res.json(recipes);
});

usersRouter.get("/me/stats", async (req, res) => {
  const [recipesCount, publishedCount, commentsCount, reactionsCount, savesCount] = await Promise.all([
    prisma.recipe.count({ where: { authorId: req.authUser!.id } }),
    prisma.recipe.count({ where: { authorId: req.authUser!.id, isPublished: true } }),
    prisma.recipeComment.count({
      where: {
        recipe: {
          authorId: req.authUser!.id,
        },
      },
    }),
    prisma.recipeReaction.count({
      where: {
        recipe: {
          authorId: req.authUser!.id,
        },
      },
    }),
    prisma.savedRecipe.count({
      where: {
        recipe: {
          authorId: req.authUser!.id,
        },
      },
    }),
  ]);

  return res.json({
    recipesCount,
    publishedCount,
    commentsCount,
    reactionsCount,
    savesCount,
  });
});
