import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BrandHeader } from "../../src/components/ui/BrandHeader";
import { useAuth } from "../../src/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { requestJson } from "../../src/lib/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type CreatorStatusPayload = {
  role: "USER" | "VERIFIED_CREATOR" | "ADMIN";
  creatorProfile?: {
    moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
    canPublish: boolean;
  } | null;
};

export default function CreateScreen() {
  const { isAuthenticated, user, token } = useAuth();
  const onboardingComplete = user?.onboardingCompleted ?? false;
  const canPublish = user?.role === "VERIFIED_CREATOR" || user?.role === "ADMIN";
  const creatorStatusQuery = useQuery({
    queryKey: ["creator-status"],
    queryFn: () => requestJson<CreatorStatusPayload>("/api/creators/me/status", { token: token ?? undefined }),
    enabled: isAuthenticated && !!token && !canPublish,
  });
  const profileStatus = creatorStatusQuery.data?.creatorProfile?.moderationStatus;

  return (
    <View style={styles.screen}>
      <BrandHeader subtitle="Verified Creator Studio" />
      <Ionicons name="sparkles-outline" size={56} color={colors.accent} />
      <Text style={styles.title}>Create and Publish</Text>
      <Text style={styles.subtitle}>
        Record step videos inside the app, add ingredients, and publish premium recipes globally.
      </Text>
      {!isAuthenticated ? (
        <Link href="/auth/login" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Sign In to Continue</Text>
          </Pressable>
        </Link>
      ) : !onboardingComplete ? (
        <Pressable style={styles.button} onPress={() => router.push("/onboarding/preferences")}>
          <Text style={styles.buttonText}>Complete Onboarding</Text>
        </Pressable>
      ) : canPublish ? (
        <>
          <Link href="/creator/publish" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Start Publishing</Text>
            </Pressable>
          </Link>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/creator/dashboard")}>
            <Text style={styles.secondaryButtonText}>Open Creator Dashboard</Text>
          </Pressable>
          {user?.role === "ADMIN" ? (
            <Pressable style={styles.secondaryButton} onPress={() => router.push("/admin/moderation")}>
              <Text style={styles.secondaryButtonText}>Open Admin Moderation</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.notice}>
            {profileStatus === "PENDING"
              ? "Your creator verification request is pending review."
              : profileStatus === "REJECTED"
                ? "Your previous verification request was rejected. You can apply again."
                : "Apply for creator verification to publish recipes."}
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/creator/apply")}>
            <Text style={styles.secondaryButtonText}>Go to Creator Verification</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: typography.body,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#121212",
    fontWeight: "700",
    fontSize: typography.body,
  },
  notice: {
    color: colors.textMuted,
    textAlign: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
});
