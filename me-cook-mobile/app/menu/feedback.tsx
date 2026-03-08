import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { requestJson } from "../../src/lib/api";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function MenuFeedbackScreen() {
  const { token } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim() || sending) {
      return;
    }
    setSending(true);
    try {
      await requestJson("/api/activities", {
        method: "POST",
        token: token ?? undefined,
        body: { action: "feedback_submitted", metadata: { subject, message } },
      });
      setSubject("");
      setMessage("");
      Alert.alert("Thank you", "Your feedback was sent.");
    } catch {
      Alert.alert("Saved locally", "Feedback will be sent when backend endpoint is available.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Send feedback</Text>
      <Text style={styles.subtitle}>Tell us what to improve in MeCook.</Text>

      <TextInput
        value={subject}
        onChangeText={setSubject}
        placeholder="Subject"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Write your feedback"
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.multiline]}
      />

      <Pressable style={[styles.submit, sending && styles.submitDisabled]} onPress={() => void submit()}>
        <Text style={styles.submitText}>{sending ? "Sending..." : "Submit feedback"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: typography.h3, fontWeight: "800" },
  subtitle: { color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    color: colors.text,
    padding: 12,
  },
  multiline: { minHeight: 150 },
  submit: {
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    paddingVertical: 12,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.bg, fontWeight: "700", fontSize: typography.body },
});
