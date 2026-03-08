import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "mecook-recently-viewed";
const MAX_ITEMS = 30;

export type RecentlyViewedItem = {
  id: string;
  slug: string;
  title: string;
  heroImageUrl?: string | null;
  viewedAt: string;
};

export async function getRecentlyViewed(): Promise<RecentlyViewedItem[]> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as RecentlyViewedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addRecentlyViewed(input: Omit<RecentlyViewedItem, "viewedAt">): Promise<void> {
  const current = await getRecentlyViewed();
  const next: RecentlyViewedItem[] = [
    { ...input, viewedAt: new Date().toISOString() },
    ...current.filter((item) => item.slug !== input.slug),
  ].slice(0, MAX_ITEMS);
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
}
