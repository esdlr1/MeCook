import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import type { CreatorStats, RecipeListItem } from "../../src/types/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function CreatorDashboardScreen() {
  const { token } = useAuth();
  const statsQuery = useQuery({
    queryKey: ["creator-stats"],
    queryFn: () => requestJson<CreatorStats>("/api/users/me/stats", { token: token ?? undefined }),
    enabled: !!token,
  });
  const recipesQuery = useQuery({
    queryKey: ["my-recipes"],
    queryFn: () => requestJson<RecipeListItem[]>("/api/users/me/recipes", { token: token ?? undefined }),
    enabled: !!token,
  });

  const stats = statsQuery.data;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Creator Dashboard</Text>
      <View style={styles.statsGrid}>
        <Card label="Recipes" value={stats?.recipesCount ?? 0} />
        <Card label="Published" value={stats?.publishedCount ?? 0} />
        <Card label="Comments" value={stats?.commentsCount ?? 0} />
        <Card label="Reactions" value={stats?.reactionsCount ?? 0} />
      </View>
      <Link href="/creator/publish" asChild>
        <Pressable style={styles.publishButton}>
          <Text style={styles.publishButtonText}>Create New Recipe</Text>
        </Pressable>
      </Link>
      <Text style={styles.sectionTitle}>My Recipes</Text>
      {recipesQuery.data?.map((recipe) => (
        <View key={recipe.id} style={styles.recipeCard}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <Text style={styles.recipeMeta}>
            {recipe.cookTimeMinutes} min • {recipe.servings} servings
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
  },
  publishButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
  },
  publishButtonText: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: typography.body,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "700",
  },
  recipeCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
  },
  recipeTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: typography.body,
  },
  recipeMeta: {
    color: colors.textMuted,
    marginTop: 4,
  },
});
