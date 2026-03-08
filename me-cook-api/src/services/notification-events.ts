import { NotificationType, Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export type CreateNotificationInput = {
  recipientId: string;
  actorId?: string;
  recipeId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoMessage = {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

async function sendExpoPush(messages: ExpoMessage[]) {
  if (!env.PUSH_ENABLED || messages.length === 0) {
    return;
  }
  const filtered = messages.filter((message) => message.to.startsWith("ExponentPushToken["));
  if (filtered.length === 0) {
    return;
  }
  const chunks: ExpoMessage[][] = [];
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

export async function createNotificationAndDispatch(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      recipeId: input.recipeId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data as Prisma.InputJsonValue | undefined,
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
  const pushAllowed =
    input.type === "COMMENT"
      ? recipient?.notifyCommentPush
      : input.type === "FOLLOW"
        ? recipient?.notifyFollowPush
        : input.type === "MODERATION_APPROVED" || input.type === "MODERATION_REJECTED"
          ? recipient?.notifyModerationPush
          : true;
  if (!pushAllowed) {
    return notification;
  }
  const messages: ExpoMessage[] = pushTokens.map((tokenRow) => ({
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
