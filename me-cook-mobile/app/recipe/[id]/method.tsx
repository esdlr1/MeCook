import { useQuery } from "@tanstack/react-query";
import { Video, ResizeMode } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { requestJson } from "../../../src/lib/api";
import type { RecipeDetail } from "../../../src/types/api";
import { colors, spacing, typography } from "../../../src/theme/tokens";

export default function RecipeMethodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeQuery = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => requestJson<RecipeDetail>(`/api/recipes/${encodeURIComponent(id ?? "")}`),
    enabled: !!id,
  });

  return (
    <View style={styles.screen}>
      <Text style={styles.headline}>How to Cook it</Text>
      <FlatList
        data={recipeQuery.data?.steps ?? []}
        keyExtractor={(step) => step.id}
        renderItem={({ item, index }) => (
          <View style={styles.step}>
            <View style={styles.stepIndex}>
              <Text style={styles.stepIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepText}>{item.instruction}</Text>
              {item.mediaAsset?.type === "IMAGE" ? (
                <Image source={item.mediaAsset.originalUrl} style={styles.stepImage} contentFit="cover" />
              ) : null}
              {item.mediaAsset?.type === "VIDEO" ? (
                <Video
                  source={{ uri: item.mediaAsset.playbackUrl ?? item.mediaAsset.originalUrl }}
                  style={styles.stepVideo}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping
                />
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headline: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "700",
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
});
