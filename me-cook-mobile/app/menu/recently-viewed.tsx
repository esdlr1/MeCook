import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getRecentlyViewed } from "../../src/lib/recently-viewed";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function MenuRecentlyViewedScreen() {
  const recentQuery = useQuery({
    queryKey: ["menu-recently-viewed"],
    queryFn: () => getRecentlyViewed(),
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your recently viewed recipes</Text>
      <Text style={styles.subtitle}>Stored locally now. Sync-ready for cross-device history next.</Text>

      {(recentQuery.data ?? []).map((item) => (
        <Link key={item.slug} href={`/recipe/${item.slug}`} asChild>
          <Pressable style={styles.row}>
            <Image
              source={
                item.heroImageUrl ??
                "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop"
              }
              style={styles.thumb}
              contentFit="cover"
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.rowMeta}>Viewed {new Date(item.viewedAt).toLocaleString()}</Text>
            </View>
          </Pressable>
        </Link>
      ))}

      {!recentQuery.isLoading && (recentQuery.data?.length ?? 0) === 0 ? (
        <Text style={styles.empty}>No history yet. Open a recipe and it will appear here.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: typography.h3, fontWeight: "800" },
  subtitle: { color: colors.textMuted },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: "hidden",
    flexDirection: "row",
    gap: 10,
  },
  thumb: { width: 98, height: 90 },
  rowBody: { flex: 1, paddingVertical: 10, paddingRight: 10, gap: 6 },
  rowTitle: { color: colors.text, fontWeight: "700", fontSize: typography.body },
  rowMeta: { color: colors.textMuted, fontSize: typography.small },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 12 },
});
