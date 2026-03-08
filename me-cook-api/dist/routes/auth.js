import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, signAccessToken, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(2),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
export const authRouter = Router();
authRouter.post("/signup", validateBody(signupSchema), async (req, res) => {
    const { email, password, displayName } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ message: "Email already in use" });
    }
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: await hashPassword(password),
            displayName,
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            onboardingCompleted: true,
            preferredCuisines: true,
            countryCode: true,
            bio: true,
            notifyCommentPush: true,
            notifyFollowPush: true,
            notifyModerationPush: true,
        },
    });
    const token = signAccessToken({ userId: user.id, role: user.role });
    return res.status(201).json({ user, token });
});
authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.isActive) {
        return res.status(403).json({ message: "Account disabled" });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signAccessToken({ userId: user.id, role: user.role });
    return res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            onboardingCompleted: user.onboardingCompleted,
            preferredCuisines: user.preferredCuisines,
            countryCode: user.countryCode,
            bio: user.bio,
            notifyCommentPush: user.notifyCommentPush,
            notifyFollowPush: user.notifyFollowPush,
            notifyModerationPush: user.notifyModerationPush,
        },
    });
});
authRouter.get("/me", requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.authUser.id },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            avatarUrl: true,
            bio: true,
            isActive: true,
            countryCode: true,
            onboardingCompleted: true,
            preferredCuisines: true,
            notifyCommentPush: true,
            notifyFollowPush: true,
            notifyModerationPush: true,
        },
    });
    if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid session" });
    }
    return res.json({ user });
});
