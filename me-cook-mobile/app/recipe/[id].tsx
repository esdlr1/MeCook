import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, ResizeMode } from "expo-av";
import { Image } from "expo-image";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Share, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import { addRecentlyViewed } from "../../src/lib/recently-viewed";
import type { RecipeDetail, RecipeListResponse } from "../../src/types/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function RecipeDetailScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const slug = id ?? "";
  const [commentBody, setCommentBody] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [activeSection, setActiveSection] = useState<"ingredients" | "method">("ingredients");

  const detailQuery = useQuery({
    queryKey: ["recipe", slug],
    queryFn: () => requestJson<RecipeDetail>(`/api/recipes/${encodeURIComponent(slug)}`),
    enabled: !!slug,
  });
  const recipe = detailQuery.data;

  const primaryIngredient = recipe?.ingredients[0]?.itemName ?? recipe?.title.split(" ")[0] ?? "";
  const similarRecipesQuery = useQuery({
    queryKey: ["similar-recipes", recipe?.id, primaryIngredient],
    queryFn: () =>
      requestJson<RecipeListResponse>(
        `/api/recipes?sort=latest&page=1&limit=6&q=${encodeURIComponent(primaryIngredient)}`,
      ),
    enabled: !!recipe && primaryIngredient.length > 0,
  });
  const similarItems = (similarRecipesQuery.data?.items ?? [])
    .filter((item) => item.id !== recipe?.id)
    .slice(0, 4);
  const sortedComments = [...(recipe?.comments ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const visibleComments = showAllComments ? sortedComments : sortedComments.slice(0, 3);

  useEffect(() => {
    if (!recipe) {
      return;
    }
    void addRecentlyViewed({
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      heroImageUrl: recipe.heroImageUrl ?? null,
    });
  }, [recipe]);

  const onShare = async () => {
    if (!recipe) {
      return;
    }
    const shareData = await requestJson<{
      message: string;
      canonicalUrl: string;
    }>(`/api/social/recipes/${encodeURIComponent(recipe.slug)}/share`);
    await Share.share({
      message: `${shareData.message}\n${shareData.canonicalUrl}`,
      url: shareData.canonicalUrl,
    });
  };

  const likeMutation = useMutation({
    mutationFn: () =>
      requestJson(`/api/recipes/${recipe?.id}/reactions/toggle`, { method: "POST", token: token ?? undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipe", slug] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      requestJson(`/api/recipes/${recipe?.id}/saves/toggle`, { method: "POST", token: token ?? undefined }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recipe", slug] }),
        queryClient.invalidateQueries({ queryKey: ["saved-recipes"] }),
      ]);
    },
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      requestJson(`/api/recipes/${recipe?.id}/comments`, {
        method: "POST",
        token: token ?? undefined,
        body: { body: commentBody.trim() },
      }),
    onSuccess: async () => {
      setCommentBody("");
      await queryClient.invalidateQueries({ queryKey: ["recipe", slug] });
    },
  });

  if (detailQuery.isLoading || !recipe) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.meta}>Loading recipe...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(42, insets.bottom + 20) }]}
      stickyHeaderIndices={[1]}
    >
      <View style={styles.topBlock}>
        <Image
          source={
            recipe.heroImageUrl ??
            "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1200&auto=format&fit=crop"
          }
          style={styles.hero}
          contentFit="cover"
        />
        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.mediaAssets.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
            {recipe.mediaAssets.slice(0, 6).map((asset) => (
              <View key={asset.id} style={styles.mediaThumbWrap}>
                <Image
                  source={asset.thumbnailUrl ?? asset.originalUrl}
                  style={styles.mediaThumb}
                  contentFit="cover"
                />
                {asset.type === "VIDEO" ? <Text style={styles.mediaBadge}>VIDEO</Text> : null}
              </View>
            ))}
          </ScrollView>
        ) : null}
        <Text style={styles.meta}>
          {recipe.cookTimeMinutes} minutes • {recipe.servings} servings
        </Text>
        <Text style={styles.creator}>Published by {recipe.author.displayName}</Text>
        <View style={styles.actionPanel}>
          <View style={styles.actions}>
            <Pressable
              style={styles.primary}
              onPress={() => router.push(`/recipe/${recipe.slug}/guided` as never)}
            >
              <Ionicons name="restaurant-outline" size={18} color={colors.bg} />
              <Text style={styles.primaryText}>Guided Cook</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={onShare}>
              <Ionicons name="share-social-outline" size={18} color={colors.text} />
              <Text style={styles.secondaryText}>Share</Text>
            </Pressable>
          </View>
          <View style={styles.socialActions}>
            <Pressable
              style={styles.chip}
              onPress={() => {
                if (!isAuthenticated || !token) {
                  Alert.alert("Sign in required", "Please sign in to like recipes.");
                  return;
                }
                likeMutation.mutate();
              }}
            >
              <Ionicons name="heart-outline" size={16} color={colors.text} />
              <Text style={styles.chipText}>Like</Text>
            </Pressable>
            <Pressable
              style={styles.chip}
              onPress={() => {
                if (!isAuthenticated || !token) {
                  Alert.alert("Sign in required", "Please sign in to save recipes.");
                  return;
                }
                saveMutation.mutate();
              }}
            >
              <Ionicons name="bookmark-outline" size={16} color={colors.text} />
              <Text style={styles.chipText}>Save</Text>
            </Pressable>
            <Pressable style={styles.chip}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
              <Text style={styles.chipText}>Comment</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.stickyTabs}>
        <View style={styles.linkRow}>
          <Pressable
            style={[styles.routeButton, activeSection === "ingredients" && styles.routeButtonActive]}
            onPress={() => setActiveSection("ingredients")}
          >
            <Text style={styles.routeText}>Ingredients</Text>
          </Pressable>
          <Pressable
            style={[styles.routeButton, activeSection === "method" && styles.routeButtonActive]}
            onPress={() => setActiveSection("method")}
          >
            <Text style={styles.routeText}>How to Cook it</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.bodyBlock}>
        {activeSection === "ingredients" ? (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.sectionSubtitle}>Serves {recipe.servings} servings</Text>
            {recipe.ingredients.map((item) => (
              <View key={item.id} style={styles.ingredientRow}>
                <Text style={styles.ingredientText}>
                  {item.quantity ? `${item.quantity} ` : ""}
                  {item.unit ? `${item.unit} ` : ""}
                  {item.itemName}
                </Text>
              </View>
            ))}
            <Link href={`/recipe/${recipe.slug}/ingredients`} style={styles.sectionLink}>
              View ingredient-only screen
            </Link>
          </View>
        ) : (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>How to Cook it</Text>
            {recipe.steps.map((step, index) => (
              <View key={step.id} style={styles.step}>
                <View style={styles.stepIndex}>
                  <Text style={styles.stepIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepText}>{step.instruction}</Text>
                  {step.mediaAsset?.type === "IMAGE" ? (
                    <Image source={step.mediaAsset.originalUrl} style={styles.stepImage} contentFit="cover" />
                  ) : null}
                  {step.mediaAsset?.type === "VIDEO" ? (
                    <Video
                      source={{ uri: step.mediaAsset.playbackUrl ?? step.mediaAsset.originalUrl }}
                      style={styles.stepVideo}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                      isLooping
                    />
                  ) : null}
                </View>
              </View>
            ))}
            <Link href={`/recipe/${recipe.slug}/method`} style={styles.sectionLink}>
              View how-to-cook screen
            </Link>
          </View>
        )}
        <View style={styles.commentsBox}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments {sortedComments.length}</Text>
            {sortedComments.length > 3 ? (
              <Pressable onPress={() => setShowAllComments((current) => !current)}>
                <Text style={styles.commentsToggle}>
                  {showAllComments ? "Show less" : `View all ${sortedComments.length}`}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {visibleComments.length > 0 ? (
            visibleComments.map((comment) => {
              const initials = comment.author.displayName
                .split(" ")
                .map((piece) => piece[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{initials}</Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={styles.commentMetaRow}>
                      <Text style={styles.commentAuthor}>{comment.author.displayName}</Text>
                      <Text style={styles.commentMeta}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.body}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyComments}>Be the first to comment on this recipe.</Text>
          )}

          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              value={commentBody}
              onChangeText={setCommentBody}
              placeholder="Add a comment"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable
              style={[
                styles.sendButton,
                (!commentBody.trim() || commentMutation.isPending) && styles.sendButtonDisabled,
              ]}
              onPress={() => {
                if (!isAuthenticated || !token) {
                  Alert.alert("Sign in required", "Please sign in to comment.");
                  return;
                }
                if (!commentBody.trim() || commentMutation.isPending) {
                  return;
                }
                commentMutation.mutate();
              }}
            >
              <Ionicons name="send" size={16} color={colors.bg} />
            </Pressable>
          </View>
        </View>
        <View style={styles.similarWrap}>
          <Text style={styles.commentsTitle}>Similar recipes</Text>
          <View style={styles.similarGrid}>
            {similarItems.map((item) => (
              <View key={`similar-${item.id}`} style={styles.similarCardWrap}>
                <Link href={`/recipe/${item.slug}`} asChild>
                  <Pressable style={styles.similarCard}>
                    <Image
                      source={
                        item.heroImageUrl ??
                        "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop"
                      }
                      style={styles.similarImage}
                      contentFit="cover"
                    />
                    <Pressable
                      style={styles.similarShareBtn}
                      onPress={async () => {
                        try {
                          const shareData = await requestJson<{ message: string; canonicalUrl: string }>(
                            `/api/social/recipes/${encodeURIComponent(item.slug)}/share`,
                          );
                          await Share.share({ message: `${shareData.message}\n${shareData.canonicalUrl}`, url: shareData.canonicalUrl });
                        } catch {
                          await Share.share({ message: `${item.title} – check it out on MeCook!` });
                        }
                      }}
                    >
                      <Ionicons name="share-social-outline" size={14} color={colors.text} />
                    </Pressable>
                    <View style={styles.similarBody}>
                      <Text style={styles.similarTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.similarMeta}>
                        {item.cookTimeMinutes} min • {item.servings} servings
                      </Text>
                    </View>
                  </Pressable>
                </Link>
              </View>
            ))}
          </View>
          {similarItems.length === 0 ? <Text style={styles.meta}>No similar recipes yet.</Text> : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  topBlock: {
    gap: spacing.md,
  },
  bodyBlock: {
    gap: spacing.md,
  },
  hero: {
    width: "100%",
    height: 260,
    borderRadius: radius.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  mediaRow: {
    gap: 10,
  },
  mediaThumbWrap: {
    position: "relative",
  },
  mediaThumb: {
    width: 132,
    height: 90,
    borderRadius: radius.md,
  },
  mediaBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: colors.text,
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  meta: {
    color: colors.textMuted,
  },
  creator: {
    color: colors.text,
    fontSize: typography.body,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionPanel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: 12,
    gap: 10,
  },
  primary: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  primaryText: {
    color: colors.bg,
    fontWeight: "700",
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "600",
  },
  linkRow: {
    flexDirection: "row",
    gap: 10,
  },
  stickyTabs: {
    paddingVertical: 10,
    backgroundColor: colors.bg,
  },
  socialActions: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
  },
  routeButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  routeButtonActive: {
    borderColor: colors.accent,
    backgroundColor: "#211b07",
  },
  routeText: {
    color: colors.text,
    fontWeight: "700",
  },
  sectionBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  ingredientRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  ingredientText: {
    color: colors.text,
    fontSize: typography.body,
  },
  sectionLink: {
    color: colors.accent,
    fontWeight: "700",
  },
  commentsBox: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentsTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: typography.body,
  },
  commentsToggle: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: typography.small,
  },
  commentCard: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentAvatarText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  commentAuthor: {
    color: colors.text,
    fontWeight: "700",
    fontSize: typography.small,
  },
  commentMeta: {
    color: colors.textMuted,
    fontSize: 11,
  },
  commentText: {
    color: colors.textMuted,
    lineHeight: 21,
    fontSize: typography.body,
  },
  emptyComments: {
    color: colors.textMuted,
    fontStyle: "italic",
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  step: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.lg,
  },
  stepIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepIndexText: {
    color: colors.text,
    fontWeight: "700",
  },
  stepText: {
    color: colors.text,
    lineHeight: 24,
    fontSize: typography.body,
  },
  stepBody: {
    flex: 1,
    gap: 10,
  },
  stepImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  stepVideo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.cardMuted,
  },
  similarWrap: {
    gap: 8,
  },
  similarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  similarCardWrap: {
    width: "48.5%",
  },
  similarCard: {
    width: "100%",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
    position: "relative",
  },
  similarShareBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  similarImage: {
    width: "100%",
    height: 120,
  },
  similarBody: {
    padding: 10,
    gap: 4,
  },
  similarTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  similarMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
});
