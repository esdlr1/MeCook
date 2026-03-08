import { useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandHeader } from "../../src/components/ui/BrandHeader";
import { useSideMenu } from "../../src/contexts/SideMenuContext";
import { IngredientCard } from "../../src/components/ui/IngredientCard";
import { SearchBar } from "../../src/components/ui/SearchBar";
import { SectionHeader } from "../../src/components/ui/SectionHeader";
import { popularDishes, popularIngredients, premiumHighlights, trendingKeywords } from "../../src/data/mock";
import { requestJson } from "../../src/lib/api";
import type { RecipeListItem } from "../../src/types/api";
import type { RecipeListResponse } from "../../src/types/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type RecentSearch = {
  id: string;
  label: string;
  image: string;
  dateLabel: string;
};

const defaultRecentSearches: RecentSearch[] = [
  { id: "recent-1", label: "Filet Mignon", image: popularIngredients[0]!.image, dateLabel: "Today" },
  { id: "recent-2", label: "Scallops", image: popularIngredients[1]!.image, dateLabel: "Today" },
  { id: "recent-3", label: "Lasagna", image: popularDishes[2]!.image, dateLabel: "Today" },
];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(defaultRecentSearches);
  const insets = useSafeAreaInsets();
  const { openMenu } = useSideMenu();

  const recipesQuery = useInfiniteQuery({
    queryKey: ["recipes", "search-home"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => requestJson<RecipeListResponse>(`/api/recipes?sort=latest&page=${pageParam}&limit=20`),
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const liveRecipes = recipesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const recentPublished = liveRecipes.slice(0, 12);

  const addRecentSearch = (label: string, image: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.label.toLowerCase() !== label.toLowerCase());
      return [{ id: `recent-${Date.now()}`, label, image, dateLabel: "Today" }, ...filtered].slice(0, 3);
    });
  };

  const openIngredient = (name: string, image: string) => {
    addRecentSearch(name, image);
    router.push({
      pathname: "/ingredient/[name]",
      params: { name },
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: 150 + insets.bottom }]}
      refreshControl={
        <RefreshControl
          refreshing={recipesQuery.isRefetching}
          onRefresh={() => {
            void recipesQuery.refetch();
          }}
          tintColor={colors.text}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <BrandHeader subtitle="Recipes & Sharing" />
        <Pressable style={styles.menuButton} onPress={openMenu}>
          <Ionicons name="menu-outline" size={24} color={colors.text} />
        </Pressable>
      </View>
      <SearchBar value={query} onChangeText={setQuery} />

      <SectionHeader title="Popular Ingredients" />
      <View style={styles.ingredientGrid}>
        {popularIngredients.map((item) => (
          <IngredientCard key={item.id} name={item.name} image={item.image} onPress={() => openIngredient(item.name, item.image)} />
        ))}
      </View>

      <SectionHeader title="Popular Dishes" />
      <View style={styles.ingredientGrid}>
        {popularDishes.map((item) => (
          <IngredientCard key={item.id} name={item.name} image={item.image} onPress={() => openIngredient(item.name, item.image)} />
        ))}
      </View>

      <SectionHeader title="Trending Keywords" rightText="Updated 14:09" />
      <View style={styles.ingredientGrid}>
        {trendingKeywords.map((item) => (
          <IngredientCard key={item.id} name={item.name} image={item.image} onPress={() => openIngredient(item.name, item.image)} />
        ))}
      </View>

      <Text style={styles.premiumTitle}>P Premium</Text>
      <View style={styles.premiumBlock}>
        {premiumHighlights.map((item) => (
          <Pressable key={item.id} style={styles.premiumItem}>
            <Image source={item.image} style={styles.premiumThumb} contentFit="cover" />
            <View style={styles.premiumCopy}>
              <Text style={styles.premiumItemTitle}>{item.title}</Text>
              <Text style={styles.premiumItemSubtitle}>{item.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.rowHeader}>
        <Text style={styles.rowHeaderTitle}>Recent searches</Text>
        <Text style={styles.rowArrow}>→</Text>
      </View>
      <View style={styles.recentList}>
        {recentSearches.map((item) => (
          <Pressable key={item.id} style={styles.recentItem} onPress={() => openIngredient(item.label, item.image)}>
            <Image source={item.image} style={styles.recentThumb} contentFit="cover" />
            <View>
              <Text style={styles.recentTitle}>{item.label}</Text>
              <Text style={styles.recentDate}>{item.dateLabel}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.rowHeader}>
        <Text style={styles.rowHeaderTitle}>Recently published recipes</Text>
        <Text style={styles.rowArrow}>→</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.publishedRow}>
        {recentPublished.map((recipe) => (
          <Pressable key={recipe.id} style={styles.publishedCard} onPress={() => router.push(`/recipe/${recipe.slug}`)}>
            <Image
              source={recipe.heroImageUrl ?? "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop"}
              style={styles.publishedImage}
              contentFit="cover"
            />
            <Text numberOfLines={2} style={styles.publishedTitle}>
              {recipe.title}
            </Text>
            <Text numberOfLines={1} style={styles.publishedAuthor}>
              {recipe.author.displayName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {recipesQuery.isLoading ? <Text style={styles.emptyText}>Loading home feed...</Text> : null}
      {recipesQuery.isError ? (
        <View style={styles.errorBlock}>
          <Text style={styles.errorTitle}>Couldn't load recipes</Text>
          <Text style={styles.emptyText}>
            Make sure the API is running on your computer (npm run dev in me-cook-api) and the database is seeded (npm run seed). On a
            physical device, set EXPO_PUBLIC_API_URL in .env to your PC IP, e.g. http://192.168.1.x:4000
          </Text>
          <Pressable style={styles.retryButton} onPress={() => void recipesQuery.refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {!recipesQuery.isLoading && !recipesQuery.isError && liveRecipes.length === 0 ? (
        <Text style={styles.emptyText}>No recipes available yet. Run npm run seed in me-cook-api.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  ingredientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  premiumTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "800",
  },
  premiumBlock: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  premiumItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  premiumThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  premiumCopy: {
    flex: 1,
    gap: 2,
  },
  premiumItemTitle: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "700",
  },
  premiumItemSubtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  rowHeaderTitle: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "800",
  },
  rowArrow: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  recentList: {
    gap: spacing.sm,
  },
  recentItem: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    overflow: "hidden",
  },
  recentThumb: {
    width: 86,
    height: 64,
  },
  recentTitle: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "700",
  },
  recentDate: {
    color: colors.textMuted,
    fontSize: typography.small,
    marginTop: 2,
  },
  publishedRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  publishedCard: {
    width: 150,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.sm,
    overflow: "hidden",
    paddingBottom: 10,
  },
  publishedImage: {
    width: "100%",
    height: 96,
    marginBottom: 8,
  },
  publishedTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  publishedAuthor: {
    color: colors.textMuted,
    paddingHorizontal: 10,
    marginTop: 4,
    fontSize: typography.small,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginVertical: 8,
  },
  errorBlock: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  errorTitle: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "700",
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  retryButtonText: {
    color: colors.bg,
    fontWeight: "700",
  },
});
