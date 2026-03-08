import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type ModerationItem = {
  id: string;
  title: string;
  summary?: string | null;
  author: { displayName: string; email: string };
};

type QueueResponse = {
  items: ModerationItem[];
  page: number;
  total: number;
};

export default function AdminModerationScreen() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const queueQuery = useQuery({
    queryKey: ["admin-moderation-queue"],
    queryFn: () => requestJson<QueueResponse>("/api/admin/moderation/recipes?status=PENDING&page=1&limit=25", { token: token ?? undefined }),
    enabled: !!token,
  });

  const decisionMutation = useMutation({
    mutationFn: ({ recipeId, approve }: { recipeId: string; approve: boolean }) =>
      requestJson(`/api/admin/moderation/recipes/${recipeId}/decision`, {
        method: "POST",
        token: token ?? undefined,
        body: {
          approve,
          moderationNotes: approve ? "Approved by admin moderation queue" : "Rejected by admin moderation queue",
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-moderation-queue"] });
    },
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Moderation Queue</Text>
      <Text style={styles.subtitle}>Pending recipes: {queueQuery.data?.total ?? 0}</Text>
      {queueQuery.data?.items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>by {item.author.displayName} ({item.author.email})</Text>
          {item.summary ? <Text style={styles.cardSummary}>{item.summary}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={styles.reject} onPress={() => decisionMutation.mutate({ recipeId: item.id, approve: false })}>
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
            <Pressable style={styles.approve} onPress={() => decisionMutation.mutate({ recipeId: item.id, approve: true })}>
              <Text style={styles.approveText}>Approve</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: typography.h3, fontWeight: "800" },
  subtitle: { color: colors.textMuted },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    gap: 6,
  },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: typography.body },
  cardMeta: { color: colors.textMuted, fontSize: typography.small },
  cardSummary: { color: colors.textMuted, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 8, marginTop: 8 },
  reject: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.cardMuted,
  },
  rejectText: { color: colors.text, fontWeight: "600" },
  approve: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.accent,
  },
  approveText: { color: colors.bg, fontWeight: "700" },
});
