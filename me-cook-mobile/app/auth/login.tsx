import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      router.replace(user.onboardingCompleted ? "/(tabs)/search" : "/onboarding/preferences");
    } catch (error) {
      Alert.alert("Sign in failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Welcome back to MeCook</Text>
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
      <Pressable style={styles.button} onPress={onLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Signing In..." : "Sign In"}</Text>
      </Pressable>
      <Link href="/auth/signup" style={styles.link}>
        New here? Create an account
      </Link>
      <Link href="/(tabs)/search" style={styles.link}>
        Continue browsing without signing in
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
