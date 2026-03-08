export type UserRole = "USER" | "VERIFIED_CREATOR" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isPremium?: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  countryCode?: string | null;
  onboardingCompleted?: boolean;
  preferredCuisines?: string[];
  notifyCommentPush?: boolean;
  notifyFollowPush?: boolean;
  notifyModerationPush?: boolean;
};

export type RecipeListItem = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  cookTimeMinutes: number;
  servings: number;
  heroImageUrl?: string | null;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  _count: {
    reactions: number;
    comments: number;
    saves: number;
  };
};

export type RecipeListResponse = {
  items: RecipeListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RecipeDetail = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  cookTimeMinutes: number;
  servings: number;
  heroImageUrl?: string | null;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  ingredients: Array<{
    id: string;
    itemName: string;
    quantity?: string | null;
    unit?: string | null;
    notes?: string | null;
  }>;
  steps: Array<{
    id: string;
    instruction: string;
    timerSeconds?: number | null;
    outcomeHint?: string | null;
    mediaAsset?: {
      id: string;
      type: "IMAGE" | "VIDEO";
      originalUrl: string;
      playbackUrl?: string | null;
      thumbnailUrl?: string | null;
      durationSeconds?: number | null;
    } | null;
  }>;
  mediaAssets: Array<{
    id: string;
    type: "IMAGE" | "VIDEO";
    originalUrl: string;
    playbackUrl?: string | null;
    thumbnailUrl?: string | null;
    durationSeconds?: number | null;
  }>;
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; displayName: string };
  }>;
  _count: {
    reactions: number;
    saves: number;
  };
};

export type CreatorStats = {
  recipesCount: number;
  publishedCount: number;
  commentsCount: number;
  reactionsCount: number;
  savesCount: number;
};

export type NotificationPreferences = {
  notifyCommentPush: boolean;
  notifyFollowPush: boolean;
  notifyModerationPush: boolean;
};
