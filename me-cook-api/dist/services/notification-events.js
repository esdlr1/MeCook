import { NotificationType, Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
async function sendExpoPush(messages) {
    if (!env.PUSH_ENABLED || messages.length === 0) {
        return;
    }
    const filtered = messages.filter((message) => message.to.startsWith("ExponentPushToken["));
    if (filtered.length === 0) {
        return;
    }
    const chunks = [];
    for (let i = 0; i < filtered.length; i += env.PUSH_BATCH_SIZE) {
        chunks.push(filtered.slice(i, i + env.PUSH_BATCH_SIZE));
    }
    for (const chunk of chunks) {
        await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(chunk),
        });
        if (env.PUSH_BATCH_DELAY_MS > 0) {
            await new Promise((resolve) => setTimeout(resolve, env.PUSH_BATCH_DELAY_MS));
        }
    }
}
export async function createNotificationAndDispatch(input) {
    const notification = await prisma.notification.create({
        data: {
            recipientId: input.recipientId,
            actorId: input.actorId,
            recipeId: input.recipeId,
            type: input.type,
            title: input.title,
            body: input.body,
            data: input.data,
        },
    });
    const pushTokens = await prisma.pushToken.findMany({
        where: { userId: input.recipientId },
        select: { token: true },
        take: 20,
    });
    const recipient = await prisma.user.findUnique({
        where: { id: input.recipientId },
        select: {
            notifyCommentPush: true,
            notifyFollowPush: true,
            notifyModerationPush: true,
        },
    });
    const pushAllowed = input.type === "COMMENT"
        ? recipient?.notifyCommentPush
        : input.type === "FOLLOW"
            ? recipient?.notifyFollowPush
            : input.type === "MODERATION_APPROVED" || input.type === "MODERATION_REJECTED"
                ? recipient?.notifyModerationPush
                : true;
    if (!pushAllowed) {
        return notification;
    }
    const messages = pushTokens.map((tokenRow) => ({
        to: tokenRow.token,
        sound: "default",
        title: input.title,
        body: input.body,
        data: {
            ...(input.data ?? {}),
            notificationId: notification.id,
            recipeId: input.recipeId,
            type: input.type,
        },
    }));
    await sendExpoPush(messages);
    return notification;
}
