import type { CreateNotificationInput } from "./notification-events.js";

export function commentNotificationTemplate(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  recipeId: string;
  recipeSlug: string;
  recipeTitle: string;
}): CreateNotificationInput {
  return {
    recipientId: input.recipientId,
    actorId: input.actorId,
    recipeId: input.recipeId,
    type: "COMMENT",
    title: "New comment on your recipe",
    body: `${input.actorDisplayName} commented on "${input.recipeTitle}".`,
    data: { recipeId: input.recipeId, recipeSlug: input.recipeSlug },
  };
}

export function followNotificationTemplate(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
}): CreateNotificationInput {
  return {
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: "FOLLOW",
    title: "You have a new follower",
    body: `${input.actorDisplayName} followed you on MeCook.`,
    data: { followerId: input.actorId },
  };
}

export function moderationNotificationTemplate(input: {
  recipientId: string;
  actorId: string;
  recipeId: string;
  recipeSlug: string;
  recipeTitle: string;
  approved: boolean;
  moderationNotes?: string;
}): CreateNotificationInput {
  return {
    recipientId: input.recipientId,
    actorId: input.actorId,
    recipeId: input.recipeId,
    type: input.approved ? "MODERATION_APPROVED" : "MODERATION_REJECTED",
    title: input.approved ? "Recipe approved" : "Recipe needs changes",
    body: input.approved
      ? `Your recipe "${input.recipeTitle}" is now live on MeCook.`
      : `Your recipe "${input.recipeTitle}" was not approved yet. Please review the notes.`,
    data: {
      recipeId: input.recipeId,
      recipeSlug: input.recipeSlug,
      moderationNotes: input.moderationNotes,
    },
  };
}
