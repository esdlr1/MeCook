import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandHeader } from "../../src/components/ui/BrandHeader";
import { RecipeCard } from "../../src/components/ui/RecipeCard";
import { SectionHeader } from "../../src/components/ui/SectionHeader";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import type { RecipeListItem } from "../../src/types/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function CollectionsScreen() {
  const { token, isAuthenticated, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const savedQuery = useQuery({
    queryKey: ["saved-recipes"],
    queryFn: () => requestJson<RecipeListItem[]>("/api/users/me/saved", { token: token ?? undefined }),
    enabled: isAuthenticated && !!token,
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}>
      <BrandHeader subtitle="Your Collection" />
      <Text style={styles.title}>Premium</Text>
      {!isAuthenticated ? (
        <>
          <Text style={styles.helper}>Sign in to view your saved recipes and collections.</Text>
          <Link href="/auth/login" asChild>
            <Pressable style={styles.loginButton}>
              <Text style={styles.loginText}>Sign In</Text>
            </Pressable>
          </Link>
        </>
      ) : (
        <>
          <SectionHeader title="Saved Recipes" />
          <Pressable style={styles.signOutButton} onPress={() => void signOut()}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
          {savedQuery.isLoading ? <Text style={styles.helper}>Loading saved recipes...</Text> : null}
          {!savedQuery.isLoading && (savedQuery.data?.length ?? 0) === 0 ? (
            <Text style={styles.helper}>No saved recipes yet. Tap save on a recipe to add it here.</Text>
          ) : null}
          {savedQuery.data?.map((recipe) => (
            <RecipeCard key={`saved-${recipe.id}`} recipe={recipe} />
          ))}
        </>
      )}
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
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  helper: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  loginButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  loginText: {
    color: colors.bg,
    fontWeight: "700",
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  signOutText: {
    color: colors.text,
    fontWeight: "600",
  },
});
