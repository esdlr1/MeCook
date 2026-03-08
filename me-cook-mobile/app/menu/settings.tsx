import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function MenuSettingsScreen() {
  const { signOut, isAuthenticated, user } = useAuth();

  const requireAuthAndOpen = (path: string) => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    router.push(path as never);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Control your account, notifications, and experience.</Text>

      <Pressable style={styles.row} onPress={() => requireAuthAndOpen("/settings/notifications")}>
        <Ionicons name="notifications-outline" size={20} color={colors.text} />
        <View style={styles.rowBody}>
          <Text style={styles.rowText}>Notification preferences</Text>
          <Text style={styles.rowSubtext}>
            {user
              ? `${user.notifyCommentPush ? "Comments" : ""}${user.notifyCommentPush && user.notifyFollowPush ? ", " : ""}${user.notifyFollowPush ? "Followers" : ""}${(user.notifyCommentPush || user.notifyFollowPush) && user.notifyModerationPush ? ", " : ""}${user.notifyModerationPush ? "Moderation" : ""}` ||
                "All off"
              : "Sign in required"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable style={styles.row} onPress={() => requireAuthAndOpen("/onboarding/preferences")}>
        <Ionicons name="options-outline" size={20} color={colors.text} />
        <View style={styles.rowBody}>
          <Text style={styles.rowText}>Cuisine and onboarding preferences</Text>
          <Text style={styles.rowSubtext}>
            {user?.preferredCuisines?.length ? `${user.preferredCuisines.slice(0, 2).join(", ")}${user.preferredCuisines.length > 2 ? " +" : ""}` : "Not configured yet"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Pressable style={styles.signOut} onPress={() => void signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
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
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowBody: { flex: 1, gap: 2 },
  rowText: { color: colors.text, fontWeight: "600" },
  rowSubtext: { color: colors.textMuted, fontSize: typography.small },
  signOut: {
    marginTop: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    paddingVertical: 11,
  },
  signOutText: { color: colors.text, fontWeight: "700" },
});
