import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const benefits = [
  "Access Popular (P) ranking and expert-only trends",
  "Unlimited premium recipe packs and chef collections",
  "Priority profile placement in discovery",
  "Advanced analytics and challenge boosts",
];

export default function MenuPremiumScreen() {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Premium</Text>
      <Text style={styles.subtitle}>Unlock the best tools and become a top MeCook creator.</Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Premium benefits</Text>
        {benefits.map((benefit) => (
          <Text key={benefit} style={styles.benefit}>
            • {benefit}
          </Text>
        ))}
      </View>

      <View style={styles.planRow}>
        <Pressable style={[styles.planCard, plan === "monthly" && styles.planCardActive]} onPress={() => setPlan("monthly")}>
          <Text style={styles.planName}>Monthly</Text>
          <Text style={styles.planPrice}>$4.99/mo</Text>
        </Pressable>
        <Pressable style={[styles.planCard, plan === "yearly" && styles.planCardActive]} onPress={() => setPlan("yearly")}>
          <Text style={styles.planName}>Yearly</Text>
          <Text style={styles.planPrice}>$49.99/yr</Text>
        </Pressable>
      </View>

      <View style={styles.trialBanner}>
        <Text style={styles.trialTitle}>Start with a 7-day free trial</Text>
        <Text style={styles.trialMeta}>Cancel anytime before trial ends.</Text>
      </View>

      <Pressable style={styles.cta}>
        <Text style={styles.ctaText}>Continue with {plan === "monthly" ? "Monthly" : "Yearly"} plan</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: typography.h3, fontWeight: "800" },
  subtitle: { color: colors.textMuted },
  panel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    gap: 8,
  },
  panelTitle: { color: colors.text, fontSize: typography.h4, fontWeight: "700" },
  benefit: { color: colors.textMuted, lineHeight: 21 },
  planRow: { flexDirection: "row", gap: 10 },
  planCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    gap: 4,
  },
  planCardActive: { borderColor: colors.accent, backgroundColor: "#211b07" },
  planName: { color: colors.text, fontWeight: "700" },
  planPrice: { color: colors.textMuted },
  trialBanner: {
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    padding: 12,
    borderWidth: 1,
    borderColor: "#5a4a1a",
    gap: 4,
  },
  trialTitle: { color: colors.text, fontWeight: "700" },
  trialMeta: { color: colors.textMuted },
  cta: {
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaText: { color: colors.bg, fontWeight: "800", fontSize: typography.body },
});
