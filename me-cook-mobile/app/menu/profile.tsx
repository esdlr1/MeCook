import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RecipeCard } from "../../src/components/ui/RecipeCard";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import type { RecipeListItem } from "../../src/types/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type TabKey = "posts" | "saved" | "about";

export default function MenuProfileScreen() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<TabKey>("posts");

  const myRecipesQuery = useQuery({
    queryKey: ["menu-profile-my-recipes"],
    queryFn: () => requestJson<RecipeListItem[]>("/api/users/me/recipes", { token: token ?? undefined }),
    enabled: !!token,
  });
  const savedQuery = useQuery({
    queryKey: ["menu-profile-saved-recipes"],
    queryFn: () => requestJson<RecipeListItem[]>("/api/users/me/saved", { token: token ?? undefined }),
    enabled: !!token,
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.displayName ?? "M")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName ?? "MeCook User"}</Text>
        <Text style={styles.handle}>@{user?.email?.split("@")[0] ?? "cook_user"}</Text>
      </View>

      <View style={styles.tabs}>
        <TabButton label="Posts" active={tab === "posts"} onPress={() => setTab("posts")} />
        <TabButton label="Saved" active={tab === "saved"} onPress={() => setTab("saved")} />
        <TabButton label="About" active={tab === "about"} onPress={() => setTab("about")} />
      </View>

      {tab === "posts" ? (
        <View style={styles.section}>
          {(myRecipesQuery.data ?? []).map((recipe) => (
            <RecipeCard key={`profile-post-${recipe.id}`} recipe={recipe} />
          ))}
          {!myRecipesQuery.isLoading && (myRecipesQuery.data?.length ?? 0) === 0 ? (
            <Text style={styles.empty}>No recipes posted yet.</Text>
          ) : null}
        </View>
      ) : null}

      {tab === "saved" ? (
        <View style={styles.section}>
          {(savedQuery.data ?? []).map((recipe) => (
            <RecipeCard key={`profile-saved-${recipe.id}`} recipe={recipe} />
          ))}
          {!savedQuery.isLoading && (savedQuery.data?.length ?? 0) === 0 ? (
            <Text style={styles.empty}>No saved recipes yet.</Text>
          ) : null}
        </View>
      ) : null}

      {tab === "about" ? (
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About this cook</Text>
          <Text style={styles.aboutText}>{user?.bio ?? "No bio yet. Add your story from settings."}</Text>
          <Text style={styles.aboutMeta}>Country: {user?.countryCode ?? "Not set"}</Text>
          <Text style={styles.aboutMeta}>Premium: {user?.isPremium ? "Yes" : "No"}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { alignItems: "center", gap: 4 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text, fontSize: typography.h3, fontWeight: "700" },
  name: { color: colors.text, fontSize: typography.h3, fontWeight: "800" },
  handle: { color: colors.textMuted },
  tabs: { flexDirection: "row", gap: 8 },
  tabBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  tabBtnActive: { borderColor: colors.accent, backgroundColor: "#211b07" },
  tabText: { color: colors.textMuted, fontWeight: "700" },
  tabTextActive: { color: colors.text },
  section: { gap: 8 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 14 },
  aboutCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    gap: 8,
  },
  aboutTitle: { color: colors.text, fontSize: typography.h4, fontWeight: "700" },
  aboutText: { color: colors.textMuted, lineHeight: 20 },
  aboutMeta: { color: colors.text, fontWeight: "600" },
});
