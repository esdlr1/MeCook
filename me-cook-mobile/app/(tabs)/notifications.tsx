import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
  recipe?: { id: string; slug: string; title: string } | null;
};

type NotificationResponse = {
  items: NotificationItem[];
  unreadCount: number;
  page: number;
  totalPages: number;
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const notificationsQuery = useQuery({
    queryKey: ["notifications-inbox"],
    queryFn: () =>
      requestJson<NotificationResponse>("/api/notifications?page=1&limit=50", {
        token: token ?? undefined,
      }),
    enabled: isAuthenticated && !!token,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      requestJson(`/api/notifications/${id}/read`, {
        method: "POST",
        token: token ?? undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications-summary"] }),
      ]);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () =>
      requestJson("/api/notifications/read-all", {
        method: "POST",
        token: token ?? undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications-summary"] }),
      ]);
    },
  });

  if (!isAuthenticated) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.helperText}>Sign in to see your notifications.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.markAllButton} onPress={() => router.push("/settings/notifications")}>
            <Text style={styles.markAllText}>Preferences</Text>
          </Pressable>
          <Pressable style={styles.markAllButton} onPress={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <Text style={styles.markAllText}>{markAllMutation.isPending ? "Marking..." : "Mark all read"}</Text>
          </Pressable>
        </View>
      </View>

      {notificationsQuery.data?.items.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.card, !item.readAt ? styles.unreadCard : undefined]}
          onPress={() => {
            if (!item.readAt) {
              markReadMutation.mutate(item.id);
            }
            if (item.recipe?.slug) {
              router.push(`/recipe/${item.recipe.slug}`);
            }
          }}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardBody}>{item.body}</Text>
          <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  centerWrap: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  helperText: { color: colors.textMuted },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerActions: { flexDirection: "row", gap: 8 },
  title: { color: colors.text, fontSize: typography.h3, fontWeight: "800" },
  markAllButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  markAllText: { color: colors.text, fontSize: typography.small, fontWeight: "600" },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    gap: 6,
  },
  unreadCard: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: typography.body },
  cardBody: { color: colors.textMuted, lineHeight: 20 },
  cardMeta: { color: colors.textMuted, fontSize: typography.small },
});
