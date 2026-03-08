import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const cuisineOptions = ["Italian", "Mexican", "Japanese", "Indian", "Mediterranean", "American", "Korean", "Thai"];

export default function OnboardingPreferencesScreen() {
  const { token, refreshMe } = useAuth();
  const [countryCode, setCountryCode] = useState("");
  const [bio, setBio] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const hydrated = useRef(false);

  const preferencesQuery = useQuery({
    queryKey: ["my-preferences"],
    queryFn: () =>
      requestJson<{
        countryCode?: string | null;
        preferredCuisines?: string[];
        bio?: string | null;
        onboardingCompleted?: boolean;
      }>("/api/users/me/preferences", {
        token: token ?? undefined,
      }),
    enabled: !!token,
  });

  useEffect(() => {
    if (!preferencesQuery.data || hydrated.current) {
      return;
    }
    hydrated.current = true;
    setCountryCode(preferencesQuery.data.countryCode ?? "");
    setBio(preferencesQuery.data.bio ?? "");
    setSelected(preferencesQuery.data.preferredCuisines ?? []);
  }, [preferencesQuery.data]);

  const canSave = useMemo(() => countryCode.trim().length >= 2 && selected.length > 0, [countryCode, selected.length]);

  const toggleCuisine = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((entry) => entry !== name) : [...prev, name]));
  };

  const onSave = async () => {
    if (!token) {
      Alert.alert("Sign in required", "Please sign in again.");
      return;
    }
    if (!canSave) {
      Alert.alert("Missing information", "Select at least one cuisine and add your country code.");
      return;
    }
    setSaving(true);
    try {
      await requestJson("/api/users/me/preferences", {
        method: "PUT",
        token,
        body: {
          countryCode: countryCode.trim().toUpperCase(),
          preferredCuisines: selected,
          bio: bio.trim() || undefined,
        },
      });
      await refreshMe();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/search");
      }
    } catch (error) {
      Alert.alert("Could not save onboarding", (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (preferencesQuery.isLoading && !hydrated.current) {
    return (
      <View style={styles.screen}>
        <Text style={styles.subtitle}>Loading your preferences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Personalize your MeCook feed</Text>
      <Text style={styles.subtitle}>Choose cuisines you love so we can tailor your recipe discovery.</Text>
      <TextInput
        style={styles.input}
        value={countryCode}
        onChangeText={setCountryCode}
        placeholder="Country code (e.g. US)"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="characters"
      />
      <TextInput
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={setBio}
        placeholder="Short bio (optional)"
        placeholderTextColor={colors.textMuted}
        multiline
      />
      <View style={styles.tagsWrap}>
        {cuisineOptions.map((option) => {
          const active = selected.includes(option);
          return (
            <Pressable key={option} style={[styles.tag, active ? styles.tagActive : undefined]} onPress={() => toggleCuisine(option)}>
              <Text style={[styles.tagText, active ? styles.tagTextActive : undefined]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={[styles.button, !canSave ? styles.buttonDisabled : undefined]} disabled={!canSave || saving} onPress={onSave}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Preferences"}</Text>
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
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    color: colors.text,
    padding: 12,
    fontSize: typography.body,
  },
  bioInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
  },
  tagActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tagText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "600",
  },
  tagTextActive: {
    color: colors.bg,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    alignItems: "center",
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: typography.body,
  },
});
