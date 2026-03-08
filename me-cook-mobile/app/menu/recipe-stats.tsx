import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import type { CreatorStats, RecipeListItem } from "../../src/types/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function MenuRecipeStatsScreen() {
  const { token } = useAuth();
  const statsQuery = useQuery({
    queryKey: ["menu-recipe-stats"],
    queryFn: () => requestJson<CreatorStats>("/api/users/me/stats", { token: token ?? undefined }),
    enabled: !!token,
  });
  const recipesQuery = useQuery({
    queryKey: ["menu-recipe-top"],
    queryFn: () => requestJson<RecipeListItem[]>("/api/users/me/recipes", { token: token ?? undefined }),
    enabled: !!token,
  });

  const stats = statsQuery.data;
  const scoreRows = [
    { label: "Engagement", value: Math.min(100, (stats?.reactionsCount ?? 0) + (stats?.commentsCount ?? 0)) },
    { label: "Saves", value: Math.min(100, (stats?.savesCount ?? 0) * 3) },
    { label: "Publishing", value: Math.min(100, (stats?.publishedCount ?? 0) * 5) },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Recipe Stats</Text>
      <Text style={styles.subtitle}>Full analytics snapshot for your creator performance.</Text>

      <View style={styles.grid}>
        <Card label="Recipes" value={stats?.recipesCount ?? 0} />
        <Card label="Published" value={stats?.publishedCount ?? 0} />
        <Card label="Comments" value={stats?.commentsCount ?? 0} />
        <Card label="Reactions" value={stats?.reactionsCount ?? 0} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Performance trends</Text>
        {scoreRows.map((row) => (
          <View key={row.label} style={styles.trendRow}>
            <Text style={styles.trendLabel}>{row.label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${row.value}%` }]} />
            </View>
            <Text style={styles.trendValue}>{row.value}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Top recipes</Text>
        {(recipesQuery.data ?? []).slice(0, 5).map((recipe) => (
          <View key={recipe.id} style={styles.recipeRow}>
            <Text numberOfLines={1} style={styles.recipeTitle}>
              {recipe.title}
            </Text>
            <Text style={styles.recipeMeta}>{recipe._count.reactions + recipe._count.comments + recipe._count.saves} pts</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: typography.h3, fontWeight: "800" },
  subtitle: { color: colors.textMuted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "47%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
  },
  cardValue: { color: colors.text, fontSize: typography.h3, fontWeight: "800" },
  cardLabel: { color: colors.textMuted },
  panel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    gap: 10,
  },
  panelTitle: { color: colors.text, fontSize: typography.h4, fontWeight: "700" },
  trendRow: { gap: 6 },
  trendLabel: { color: colors.textMuted, fontSize: typography.small },
  track: { height: 8, borderRadius: 8, backgroundColor: colors.cardMuted, overflow: "hidden" },
  fill: { height: 8, backgroundColor: colors.accent, borderRadius: 8 },
  trendValue: { color: colors.text, fontWeight: "700", alignSelf: "flex-end" },
  recipeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recipeTitle: { color: colors.text, flex: 1, marginRight: 8 },
  recipeMeta: { color: colors.textMuted, fontSize: typography.small },
});
