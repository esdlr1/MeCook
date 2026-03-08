import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const faqs = [
  {
    id: "f1",
    q: "How do I publish a recipe?",
    a: "Open Create, fill recipe details, add ingredients and How to Cook it steps, then publish.",
  },
  {
    id: "f2",
    q: "How does Premium work?",
    a: "Premium unlocks advanced discovery, special badges, and extra creator analytics.",
  },
  {
    id: "f3",
    q: "Can I edit a recipe after publishing?",
    a: "Yes. Open your recipe from Profile > Posts and use edit actions.",
  },
  {
    id: "f4",
    q: "How are challenges judged?",
    a: "Challenges are scored by engagement, completion quality, and rule alignment.",
  },
];

export default function MenuFaqScreen() {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Frequently Asked Questions</Text>
      <Text style={styles.subtitle}>Quick answers to common MeCook questions.</Text>

      {faqs.map((item) => {
        const open = item.id === openId;
        return (
          <View key={item.id} style={styles.card}>
            <Pressable style={styles.qRow} onPress={() => setOpenId((prev) => (prev === item.id ? null : item.id))}>
              <Text style={styles.qText}>{item.q}</Text>
              <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
            </Pressable>
            {open ? <Text style={styles.aText}>{item.a}</Text> : null}
          </View>
        );
      })}
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
    gap: 10,
  },
  qRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  qText: { color: colors.text, fontWeight: "700", flex: 1 },
  aText: { color: colors.textMuted, lineHeight: 20 },
});
