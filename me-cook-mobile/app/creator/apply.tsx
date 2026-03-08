import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type CreatorStatusPayload = {
  role: "USER" | "VERIFIED_CREATOR" | "ADMIN";
  creatorProfile?: {
    moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
    canPublish: boolean;
    reviewedAt?: string | null;
    reviewNotes?: string | null;
  } | null;
};

export default function CreatorApplyScreen() {
  const { token, isAuthenticated, refreshMe } = useAuth();

  const statusQuery = useQuery({
    queryKey: ["creator-status"],
    queryFn: () => requestJson<CreatorStatusPayload>("/api/creators/me/status", { token: token ?? undefined }),
    enabled: isAuthenticated && !!token,
  });

  const applyMutation = useMutation({
    mutationFn: () => requestJson("/api/creators/me/apply", { method: "POST", token: token ?? undefined }),
    onSuccess: async () => {
      await Promise.all([statusQuery.refetch(), refreshMe()]);
      Alert.alert("Application sent", "Your creator verification request is now pending review.");
    },
    onError: (error) => {
      Alert.alert("Request failed", (error as Error).message);
    },
  });

  const statusMessage = useMemo(() => {
    if (!statusQuery.data?.creatorProfile) {
      return "You have not submitted a creator verification request yet.";
    }
    if (statusQuery.data.creatorProfile.moderationStatus === "PENDING") {
      return "Your creator verification is pending admin review.";
    }
    if (statusQuery.data.creatorProfile.moderationStatus === "APPROVED") {
      return "You are approved as a verified creator. You can now publish recipes.";
    }
    return `Verification was rejected${statusQuery.data.creatorProfile.reviewNotes ? `: ${statusQuery.data.creatorProfile.reviewNotes}` : "."}`;
  }, [statusQuery.data?.creatorProfile]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Creator Verification</Text>
      <Text style={styles.description}>
        Verified creators can publish public recipes with step videos and reach the global MeCook audience.
      </Text>
      <Text style={styles.status}>{statusMessage}</Text>
      <Pressable
        style={styles.button}
        onPress={() => applyMutation.mutate()}
        disabled={applyMutation.isPending || statusQuery.data?.creatorProfile?.moderationStatus === "PENDING"}
      >
        <Text style={styles.buttonText}>
          {statusQuery.data?.creatorProfile?.moderationStatus === "PENDING"
            ? "Application Pending"
            : applyMutation.isPending
              ? "Submitting..."
              : "Apply for Verification"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    gap: spacing.md,
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  status: {
    color: colors.text,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    lineHeight: 21,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: typography.body,
  },
});
