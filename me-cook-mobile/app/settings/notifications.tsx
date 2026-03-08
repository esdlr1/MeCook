import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import type { NotificationPreferences } from "../../src/types/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function NotificationPreferencesScreen() {
  const { token, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const prefsQuery = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => requestJson<NotificationPreferences>("/api/users/me/notification-preferences", { token: token ?? undefined }),
    enabled: !!token,
  });

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!prefsQuery.data) {
      return;
    }
    setLocalPrefs((current) => current ?? prefsQuery.data);
  }, [prefsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: NotificationPreferences) =>
      requestJson<NotificationPreferences>("/api/users/me/notification-preferences", {
        method: "PUT",
        token: token ?? undefined,
        body: payload,
      }),
    onSuccess: async (payload) => {
      queryClient.setQueryData(["notification-preferences"], payload);
      setLocalPrefs(payload);
      setLastSavedAt(new Date().toISOString());
      await refreshMe();
    },
    onError: (error) => {
      Alert.alert("Save failed", (error as Error).message);
    },
  });

  const dirty = useMemo(() => {
    if (!localPrefs || !prefsQuery.data) {
      return false;
    }
    return JSON.stringify(localPrefs) !== JSON.stringify(prefsQuery.data);
  }, [localPrefs, prefsQuery.data]);

  if (!localPrefs) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.helper}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Push Notification Preferences</Text>
      <Text style={styles.subtitle}>Choose which push notifications you want to receive on your device.</Text>
      <Text style={styles.statusText}>
        {saveMutation.isPending
          ? "Saving..."
          : dirty
            ? "Unsaved changes"
            : lastSavedAt
              ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
              : "All changes saved"}
      </Text>
      <PreferenceRow
        label="Comments on my recipes"
        value={localPrefs.notifyCommentPush}
        onChange={(value) => {
          const previous = localPrefs;
          const next = { ...localPrefs, notifyCommentPush: value };
          setLocalPrefs(next);
          saveMutation.mutate(next, {
            onError: () => {
              setLocalPrefs(previous);
            },
          });
        }}
      />
      <PreferenceRow
        label="New followers"
        value={localPrefs.notifyFollowPush}
        onChange={(value) => {
          const previous = localPrefs;
          const next = { ...localPrefs, notifyFollowPush: value };
          setLocalPrefs(next);
          saveMutation.mutate(next, {
            onError: () => {
              setLocalPrefs(previous);
            },
          });
        }}
      />
      <PreferenceRow
        label="Moderation updates"
        value={localPrefs.notifyModerationPush}
        onChange={(value) => {
          const previous = localPrefs;
          const next = { ...localPrefs, notifyModerationPush: value };
          setLocalPrefs(next);
          saveMutation.mutate(next, {
            onError: () => {
              setLocalPrefs(previous);
            },
          });
        }}
      />
    </View>
  );
}

function PreferenceRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} thumbColor={value ? colors.accent : "#8A8A8A"} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  helper: {
    color: colors.textMuted,
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: typography.small,
    marginBottom: 2,
  },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    color: colors.text,
    fontSize: typography.body,
    flex: 1,
    marginRight: spacing.md,
  },
});
