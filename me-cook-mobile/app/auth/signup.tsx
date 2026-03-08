import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please complete all fields.");
      return;
    }
    if (password.trim().length < 8) {
      Alert.alert("Password too short", "Use at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const user = await signUp(email.trim(), password, displayName.trim());
      router.replace(user.onboardingCompleted ? "/(tabs)/search" : "/onboarding/preferences");
    } catch (error) {
      Alert.alert("Signup failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create your MeCook account</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Display name"
        placeholderTextColor={colors.textMuted}
      />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
      />
      <Pressable style={styles.button} onPress={onSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Creating..." : "Create Account"}</Text>
      </Pressable>
      <Link href="/auth/login" style={styles.link}>
        Already have an account? Sign in
      </Link>
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
    marginBottom: spacing.sm,
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
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: typography.body,
  },
  link: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
