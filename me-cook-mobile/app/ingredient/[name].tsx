import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RecipeCard } from "../../src/components/ui/RecipeCard";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import type { RecipeListResponse } from "../../src/types/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type DiscoverTab = "latest" | "popular";

export default function IngredientResultsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ name?: string }>();
  const ingredient = decodeURIComponent(params.name ?? "").trim();
  const [tab, setTab] = useState<DiscoverTab>("latest");
  const { user } = useAuth();
  const hasPremiumAccess = Boolean((user as { isPremium?: boolean } | null)?.isPremium || user?.role === "ADMIN");
  const canSeePopular = tab === "latest" || hasPremiumAccess;

  const recipesQuery = useInfiniteQuery({
    queryKey: ["recipes", "ingredient", ingredient, tab],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      requestJson<RecipeListResponse>(
        `/api/recipes?sort=${tab === "popular" ? "popular" : "latest"}&page=${pageParam}&limit=20&q=${encodeURIComponent(ingredient)}`,
      ),
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled: ingredient.length > 0 && canSeePopular,
  });

  const items = recipesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const provenItems = useMemo(() => items.slice(0, 5), [items]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <Text numberOfLines={1} style={styles.searchText}>
            {ingredient}
          </Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable style={[styles.tabButton, tab === "latest" && styles.tabButtonActive]} onPress={() => setTab("latest")}>
          <Text style={[styles.tabText, tab === "latest" && styles.tabTextActive]}>Latest</Text>
        </Pressable>
        <Pressable style={[styles.tabButton, tab === "popular" && styles.tabButtonActive]} onPress={() => setTab("popular")}>
          <Text style={[styles.tabText, tab === "popular" && styles.tabTextActive]}>
            <Text style={styles.pBadge}>P </Text>
            Popular
          </Text>
        </Pressable>
      </View>

      {!hasPremiumAccess ? (
        <Text style={styles.premiumHint}>Popular tab is for Premium users.</Text>
      ) : null}
      {recipesQuery.error ? <Text style={styles.errorText}>Load failed: {String(recipesQuery.error.message)}</Text> : null}

      {tab === "popular" && !hasPremiumAccess ? (
        <View style={styles.lockedCard}>
          <Text style={styles.lockedTitle}>Premium Required</Text>
          <Text style={styles.lockedText}>Upgrade to Premium to unlock popular ranking and proven recipe lists.</Text>
          <Pressable style={styles.lockedButton} onPress={() => setTab("latest")}>
            <Text style={styles.lockedButtonText}>Back to Latest</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 130 + insets.bottom, paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.provenTitle}>
                Proven recipes "{ingredient}"
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.provenRow}>
                {provenItems.map((item, index) => (
                  <Pressable key={item.id} style={styles.provenCard} onPress={() => router.push(`/recipe/${item.slug}`)}>
                    <Text style={styles.provenRank}>{index + 1}</Text>
                    <Text numberOfLines={2} style={styles.provenName}>
                      {item.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Latest recipes ({items.length})</Text>
              </View>
            </View>
          }
          ListEmptyComponent={!recipesQuery.isLoading ? <Text style={styles.emptyText}>No recipes found for this ingredient.</Text> : null}
          ListFooterComponent={
            recipesQuery.hasNextPage ? (
              <Text style={styles.emptyText}>{recipesQuery.isFetchingNextPage ? "Loading more..." : "Scroll for more recipes"}</Text>
            ) : (
              <Text style={styles.emptyText}>You reached the end.</Text>
            )
          }
          onEndReachedThreshold={0.45}
          onEndReached={() => {
            if (recipesQuery.hasNextPage && !recipesQuery.isFetchingNextPage) {
              void recipesQuery.fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={recipesQuery.isRefetching && !recipesQuery.isFetchingNextPage}
              onRefresh={() => {
                void recipesQuery.refetch();
              }}
              tintColor={colors.text}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchText: { color: colors.text, fontSize: typography.h4, fontWeight: "600", flex: 1 },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    paddingVertical: 8,
  },
  tabButtonActive: {
    borderBottomColor: colors.accent,
  },
  tabText: { color: colors.textMuted, fontSize: typography.h4, fontWeight: "700" },
  tabTextActive: { color: colors.text },
  pBadge: { color: colors.accent, fontWeight: "800" },
  premiumHint: {
    color: colors.textMuted,
    fontSize: typography.small,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  lockedCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  lockedTitle: { color: colors.text, fontSize: typography.h4, fontWeight: "800" },
  lockedText: { color: colors.textMuted, lineHeight: 20 },
  lockedButton: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  lockedButtonText: { color: colors.text, fontWeight: "700" },
  list: { flex: 1 },
  listHeader: { paddingTop: spacing.sm },
  provenTitle: { color: colors.text, fontSize: typography.h3, fontWeight: "800", marginBottom: spacing.sm },
  provenRow: { gap: spacing.sm, paddingBottom: spacing.md },
  provenCard: {
    width: 130,
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    padding: 10,
    justifyContent: "space-between",
  },
  provenRank: { color: colors.accent, fontWeight: "800" },
  provenName: { color: colors.text, fontSize: typography.small, fontWeight: "700" },
  sectionTitleRow: { marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: typography.h3, fontWeight: "800" },
  emptyText: { color: colors.textMuted, textAlign: "center", marginVertical: spacing.md },
});
