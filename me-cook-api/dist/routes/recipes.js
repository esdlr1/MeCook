import { UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createNotificationAndDispatch } from "../services/notification-events.js";
import { commentNotificationTemplate } from "../services/notification-templates.js";
const recipeCreateSchema = z.object({
    title: z.string().min(3),
    summary: z.string().optional(),
    cookTimeMinutes: z.number().int().positive(),
    prepTimeMinutes: z.number().int().nonnegative().optional(),
    servings: z.number().int().positive(),
    cuisine: z.string().optional(),
    difficulty: z.string().optional(),
    tags: z.array(z.string()).default([]),
    ingredients: z
        .array(z.object({
        itemName: z.string().min(1),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        notes: z.string().optional(),
    }))
        .default([]),
    steps: z
        .array(z.object({
        instruction: z.string().min(1),
        timerSeconds: z.number().int().nonnegative().optional(),
    }))
        .default([]),
});
const commentSchema = z.object({
    body: z.string().min(1).max(1000),
    parentId: z.string().cuid().optional(),
});
const reportSchema = z.object({
    reason: z.string().min(2),
    notes: z.string().optional(),
});
const listQuerySchema = z.object({
    q: z.string().trim().optional(),
    tag: z.string().trim().optional(),
    cuisine: z.string().trim().optional(),
    difficulty: z.string().trim().optional(),
    locale: z.string().trim().optional(),
    minCook: z.coerce.number().int().nonnegative().optional(),
    maxCook: z.coerce.number().int().nonnegative().optional(),
    sort: z.enum(["latest", "popular"]).default("latest"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});
const recipeUpdateSchema = z.object({
    title: z.string().min(3).optional(),
    summary: z.string().optional(),
    cookTimeMinutes: z.number().int().positive().optional(),
    prepTimeMinutes: z.number().int().nonnegative().optional(),
    servings: z.number().int().positive().optional(),
    cuisine: z.string().optional(),
    difficulty: z.string().optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
    heroImageUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    ingredients: z
        .array(z.object({
        itemName: z.string().min(1),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        notes: z.string().optional(),
    }))
        .optional(),
    steps: z
        .array(z.object({
        instruction: z.string().min(1),
        timerSeconds: z.number().int().nonnegative().optional(),
        mediaAssetId: z.string().cuid().optional(),
    }))
        .optional(),
});
function isRecipePubliclyViewable(recipe) {
    return recipe.isPublished && recipe.moderationStatus === "APPROVED" && recipe.visibility === "PUBLIC";
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
export const recipesRouter = Router();
recipesRouter.get("/", async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid query parameters", issues: parsed.error.issues });
    }
    const { q, tag, cuisine, difficulty, locale, minCook, maxCook, sort, page, limit } = parsed.data;
    const skip = (page - 1) * limit;
    const items = await prisma.recipe.findMany({
        where: {
            isPublished: true,
            visibility: "PUBLIC",
            moderationStatus: "APPROVED",
            ...(locale ? { locale } : {}),
            ...(q
                ? {
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { ingredients: { some: { itemName: { contains: q, mode: "insensitive" } } } },
                    ],
                }
                : {}),
            ...(tag ? { tags: { some: { tag: { equals: tag, mode: "insensitive" } } } } : {}),
            ...(cuisine ? { cuisine: { equals: cuisine, mode: "insensitive" } } : {}),
            ...(difficulty ? { difficulty: { equals: difficulty, mode: "insensitive" } } : {}),
            ...(minCook !== undefined ? { cookTimeMinutes: { gte: minCook } } : {}),
            ...(maxCook !== undefined ? { cookTimeMinutes: { lte: maxCook } } : {}),
        },
        include: {
            author: { select: { id: true, displayName: true, avatarUrl: true } },
            tags: true,
            _count: { select: { reactions: true, comments: true, saves: true } },
        },
        orderBy: sort === "popular" ? [{ reactions: { _count: "desc" } }, { publishedAt: "desc" }] : [{ publishedAt: "desc" }],
        skip,
        take: limit,
    });
    const total = await prisma.recipe.count({
        where: {
            isPublished: true,
            visibility: "PUBLIC",
            moderationStatus: "APPROVED",
            ...(locale ? { locale } : {}),
            ...(q
                ? {
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { ingredients: { some: { itemName: { contains: q, mode: "insensitive" } } } },
                    ],
                }
                : {}),
            ...(tag ? { tags: { some: { tag: { equals: tag, mode: "insensitive" } } } } : {}),
            ...(cuisine ? { cuisine: { equals: cuisine, mode: "insensitive" } } : {}),
            ...(difficulty ? { difficulty: { equals: difficulty, mode: "insensitive" } } : {}),
            ...(minCook !== undefined ? { cookTimeMinutes: { gte: minCook } } : {}),
            ...(maxCook !== undefined ? { cookTimeMinutes: { lte: maxCook } } : {}),
        },
    });
    return res.json({
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});
recipesRouter.get("/feed/trending", async (_req, res) => {
    const items = await prisma.recipe.findMany({
        where: {
            isPublished: true,
            visibility: "PUBLIC",
            moderationStatus: "APPROVED",
        },
        include: {
            author: { select: { id: true, displayName: true, avatarUrl: true } },
            tags: true,
            _count: { select: { reactions: true, comments: true, saves: true } },
        },
        orderBy: [{ publishedAt: "desc" }],
        take: 100,
    });
    const ranked = items
        .map((item) => ({
        ...item,
        trendScore: item._count.reactions * 3 + item._count.comments * 2 + item._count.saves,
    }))
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 20);
    return res.json(ranked);
});
recipesRouter.get("/:slug", async (req, res) => {
    const slug = String(req.params.slug);
    const recipe = await prisma.recipe.findUnique({
        where: { slug },
        include: {
            author: { select: { id: true, displayName: true, avatarUrl: true } },
            ingredients: { orderBy: { position: "asc" } },
            steps: { orderBy: { position: "asc" } },
            mediaAssets: true,
            tags: true,
            comments: {
                where: { parentId: null },
                orderBy: { createdAt: "desc" },
                include: {
                    author: { select: { id: true, displayName: true, avatarUrl: true } },
                    replies: {
                        orderBy: { createdAt: "asc" },
                        include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
                    },
                },
            },
            _count: { select: { reactions: true, saves: true } },
        },
    });
    if (!recipe || !isRecipePubliclyViewable(recipe)) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    return res.json(recipe);
});
recipesRouter.post("/", requireAuth, requireRole([UserRole.VERIFIED_CREATOR, UserRole.ADMIN]), validateBody(recipeCreateSchema), async (req, res) => {
    const payload = req.body;
    const slugBase = slugify(payload.title);
    const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    const recipe = await prisma.recipe.create({
        data: {
            authorId: req.authUser.id,
            title: payload.title,
            slug,
            summary: payload.summary,
            cookTimeMinutes: payload.cookTimeMinutes,
            prepTimeMinutes: payload.prepTimeMinutes,
            servings: payload.servings,
            cuisine: payload.cuisine,
            difficulty: payload.difficulty,
            moderationStatus: "PENDING",
            isPublished: false,
            publishedAt: null,
            ingredients: {
                create: payload.ingredients.map((ingredient, index) => ({
                    ...ingredient,
                    position: index,
                })),
            },
            steps: {
                create: payload.steps.map((step, index) => ({
                    ...step,
                    position: index,
                })),
            },
            tags: {
                create: payload.tags.map((tag) => ({ tag })),
            },
        },
        include: {
            ingredients: true,
            steps: true,
            tags: true,
        },
    });
    return res.status(201).json(recipe);
});
recipesRouter.patch("/:recipeId", requireAuth, validateBody(recipeUpdateSchema), async (req, res) => {
    const recipeId = String(req.params.recipeId);
    const payload = req.body;
    const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!existing) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    const isOwner = existing.authorId === req.authUser.id;
    const isAdmin = req.authUser.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "You cannot edit this recipe" });
    }
    const updateData = {
        title: payload.title,
        slug: payload.title ? `${slugify(payload.title)}-${Date.now().toString().slice(-5)}` : undefined,
        summary: payload.summary,
        cookTimeMinutes: payload.cookTimeMinutes,
        prepTimeMinutes: payload.prepTimeMinutes,
        servings: payload.servings,
        cuisine: payload.cuisine,
        difficulty: payload.difficulty,
        visibility: payload.visibility,
        heroImageUrl: payload.heroImageUrl,
    };
    const updated = await prisma.$transaction(async (tx) => {
        if (payload.ingredients) {
            await tx.recipeIngredient.deleteMany({ where: { recipeId } });
        }
        if (payload.steps) {
            await tx.recipeStep.deleteMany({ where: { recipeId } });
        }
        if (payload.tags) {
            await tx.recipeTag.deleteMany({ where: { recipeId } });
        }
        return tx.recipe.update({
            where: { id: recipeId },
            data: {
                ...updateData,
                moderationStatus: "PENDING",
                isPublished: false,
                publishedAt: null,
                ...(payload.ingredients
                    ? {
                        ingredients: {
                            create: payload.ingredients.map((ingredient, index) => ({
                                ...ingredient,
                                position: index,
                            })),
                        },
                    }
                    : {}),
                ...(payload.steps
                    ? {
                        steps: {
                            create: payload.steps.map((step, index) => ({
                                instruction: step.instruction,
                                timerSeconds: step.timerSeconds,
                                mediaAssetId: step.mediaAssetId,
                                position: index,
                            })),
                        },
                    }
                    : {}),
                ...(payload.tags
                    ? {
                        tags: {
                            create: payload.tags.map((tag) => ({ tag })),
                        },
                    }
                    : {}),
            },
            include: {
                ingredients: true,
                steps: true,
                tags: true,
            },
        });
    });
    return res.json(updated);
});
recipesRouter.post("/:recipeId/submit-for-review", requireAuth, async (req, res) => {
    const recipeId = String(req.params.recipeId);
    const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!existing) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    if (existing.authorId !== req.authUser.id && req.authUser.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "You cannot submit this recipe" });
    }
    const updated = await prisma.recipe.update({
        where: { id: recipeId },
        data: {
            moderationStatus: "PENDING",
            isPublished: false,
            publishedAt: null,
        },
    });
    return res.json(updated);
});
recipesRouter.post("/:recipeId/comments", requireAuth, validateBody(commentSchema), async (req, res) => {
    const recipeId = String(req.params.recipeId);
    const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true, authorId: true, title: true, slug: true, isPublished: true, moderationStatus: true, visibility: true },
    });
    if (!recipe || !isRecipePubliclyViewable(recipe)) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    if (req.body.parentId) {
        const parent = await prisma.recipeComment.findUnique({ where: { id: req.body.parentId } });
        if (!parent || parent.recipeId !== recipeId) {
            return res.status(400).json({ message: "Invalid parent comment" });
        }
    }
    const comment = await prisma.recipeComment.create({
        data: {
            recipeId: recipe.id,
            authorId: req.authUser.id,
            body: req.body.body,
            parentId: req.body.parentId,
        },
    });
    if (recipe.authorId !== req.authUser.id) {
        const actor = await prisma.user.findUnique({
            where: { id: req.authUser.id },
            select: { displayName: true },
        });
        await createNotificationAndDispatch(commentNotificationTemplate({
            recipientId: recipe.authorId,
            actorId: req.authUser.id,
            actorDisplayName: actor?.displayName ?? "Someone",
            recipeId: recipe.id,
            recipeSlug: recipe.slug,
            recipeTitle: recipe.title,
        }));
    }
    return res.status(201).json(comment);
});
recipesRouter.post("/:recipeId/reactions/toggle", requireAuth, async (req, res) => {
    const recipeId = String(req.params.recipeId);
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe || !isRecipePubliclyViewable(recipe)) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    const existing = await prisma.recipeReaction.findUnique({
        where: { recipeId_userId: { recipeId, userId: req.authUser.id } },
    });
    if (existing) {
        await prisma.recipeReaction.delete({
            where: { recipeId_userId: { recipeId, userId: req.authUser.id } },
        });
        return res.json({ liked: false });
    }
    await prisma.recipeReaction.create({
        data: {
            recipeId,
            userId: req.authUser.id,
        },
    });
    return res.json({ liked: true });
});
recipesRouter.post("/:recipeId/saves/toggle", requireAuth, async (req, res) => {
    const recipeId = String(req.params.recipeId);
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe || !isRecipePubliclyViewable(recipe)) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    const existing = await prisma.savedRecipe.findUnique({
        where: { recipeId_userId: { recipeId, userId: req.authUser.id } },
    });
    if (existing) {
        await prisma.savedRecipe.delete({
            where: { recipeId_userId: { recipeId, userId: req.authUser.id } },
        });
        return res.json({ saved: false });
    }
    await prisma.savedRecipe.create({
        data: {
            recipeId,
            userId: req.authUser.id,
        },
    });
    return res.json({ saved: true });
});
recipesRouter.post("/:recipeId/report", requireAuth, validateBody(reportSchema), async (req, res) => {
    const recipeId = String(req.params.recipeId);
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe || !isRecipePubliclyViewable(recipe)) {
        return res.status(404).json({ message: "Recipe not found" });
    }
    const report = await prisma.contentReport.create({
        data: {
            recipeId,
            submitterId: req.authUser.id,
            reason: req.body.reason,
            notes: req.body.notes,
        },
    });
    return res.status(201).json(report);
});
