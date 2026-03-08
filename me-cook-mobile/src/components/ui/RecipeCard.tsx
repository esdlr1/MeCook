import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useCallback } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { requestJson } from "../../lib/api";
import type { RecipeListItem } from "../../types/api";
import { colors, radius, typography } from "../../theme/tokens";

type RecipeCardProps = {
  recipe: RecipeListItem;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const onShare = useCallback(async () => {
    try {
      const shareData = await requestJson<{ message: string; canonicalUrl: string }>(
        `/api/social/recipes/${encodeURIComponent(recipe.slug)}/share`,
      );
      await Share.share({
        message: `${shareData.message}\n${shareData.canonicalUrl}`,
        url: shareData.canonicalUrl,
      });
    } catch {
      await Share.share({
        message: `${recipe.title} – check it out on MeCook!`,
      });
    }
  }, [recipe.slug, recipe.title]);

  return (
    <View style={styles.cardWrap}>
      <Link href={`/recipe/${recipe.slug}`} asChild>
        <Pressable style={styles.card}>
          <Image source={recipe.heroImageUrl ?? "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop"} style={styles.image} contentFit="cover" />
          <Pressable style={styles.shareButton} onPress={onShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="share-social-outline" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.content}>
            <Text style={styles.title}>{recipe.title}</Text>
            <Text style={styles.meta}>
              {recipe.cookTimeMinutes} min • {recipe.servings} servings
            </Text>
            <Text style={styles.creator}>{recipe.author.displayName}</Text>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  image: {
    height: 155,
    width: "100%",
  },
  shareButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  content: {
    padding: 12,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "700",
  },
  meta: {
    color: colors.textMuted,
  },
  creator: {
    color: colors.text,
    opacity: 0.9,
    fontSize: typography.small,
  },
});
