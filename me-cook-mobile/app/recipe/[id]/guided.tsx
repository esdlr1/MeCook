import { useQuery } from "@tanstack/react-query";
import { Video, ResizeMode } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { requestJson } from "../../../src/lib/api";
import type { RecipeDetail } from "../../../src/types/api";
import { colors, radius, spacing, typography } from "../../../src/theme/tokens";

export default function GuidedCookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const slug = id ?? "";
  const [stepIndex, setStepIndex] = useState(0);

  const recipeQuery = useQuery({
    queryKey: ["recipe", slug],
    queryFn: () => requestJson<RecipeDetail>(`/api/recipes/${encodeURIComponent(slug)}`),
    enabled: !!slug,
  });

  const recipe = recipeQuery.data;
  const steps = recipe?.steps ?? [];
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= totalSteps - 1 && totalSteps > 0;

  const goBack = () => {
    if (isFirst) {
      router.back();
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    if (isLast) {
      router.back();
      return;
    }
    setStepIndex((i) => Math.min(totalSteps - 1, i + 1));
  };

  if (recipeQuery.isLoading || !recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>Loading recipe...</Text>
      </View>
    );
  }

  if (totalSteps === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>No steps for this recipe.</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to recipe</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
      {/* Step progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Step {stepIndex + 1} of {totalSteps}
        </Text>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === stepIndex && styles.dotActive,
                i < stepIndex && styles.dotDone,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepCard}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
          </View>
          <Text style={styles.instruction}>{currentStep?.instruction}</Text>
          {currentStep?.mediaAsset?.type === "IMAGE" ? (
            <Image
              source={currentStep.mediaAsset.originalUrl}
              style={styles.media}
              contentFit="cover"
            />
          ) : null}
          {currentStep?.mediaAsset?.type === "VIDEO" ? (
            <Video
              source={{
                uri:
                  currentStep.mediaAsset.playbackUrl ?? currentStep.mediaAsset.originalUrl,
              }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
          ) : null}
        </View>
      </ScrollView>

      {/* Large controls */}
      <View style={styles.controls}>
        <Pressable
          style={[styles.controlButton, styles.controlBack]}
          onPress={goBack}
        >
          <Ionicons
            name={isFirst ? "arrow-back" : "chevron-back"}
            size={24}
            color={colors.text}
          />
          <Text style={styles.controlBackText}>
            {isFirst ? "Exit" : "Previous"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.controlButton, styles.controlNext]}
          onPress={goNext}
        >
          <Text style={styles.controlNextText}>
            {isLast ? "Done" : "Next"}
          </Text>
          <Ionicons
            name={isLast ? "checkmark" : "chevron-forward"}
            size={24}
            color={colors.bg}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  meta: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotDone: {
    backgroundColor: colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stepCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  stepNumberBadge: {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: colors.bg,
    fontSize: typography.h4,
    fontWeight: "800",
  },
  instruction: {
    color: colors.text,
    fontSize: typography.h4,
    lineHeight: 28,
    fontWeight: "600",
  },
  media: {
    width: "100%",
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
  },
  video: {
    width: "100%",
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
  },
  controls: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  controlButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  controlBack: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlBackText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  controlNext: {
    backgroundColor: colors.accent,
  },
  controlNextText: {
    color: colors.bg,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
