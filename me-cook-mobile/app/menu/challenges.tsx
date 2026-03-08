import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const challenges = [
  { id: "c1", name: "One-pan dinner week", deadline: "Ends in 3 days", prize: "Featured badge" },
  { id: "c2", name: "30-minute family meals", deadline: "Ends in 6 days", prize: "Premium spotlight" },
  { id: "c3", name: "Global street food remix", deadline: "Ends in 10 days", prize: "Creator boost" },
];

export default function MenuChallengesScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Challenges</Text>
      <Text style={styles.subtitle}>Join challenges, publish entries, and grow your audience.</Text>

      {challenges.map((challenge) => (
        <View key={challenge.id} style={styles.card}>
          <Text style={styles.cardTitle}>{challenge.name}</Text>
          <Text style={styles.meta}>{challenge.deadline}</Text>
          <Text style={styles.meta}>Prize: {challenge.prize}</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.ghostBtn}>
              <Text style={styles.ghostText}>Join</Text>
            </Pressable>
            <Link href="/creator/publish" asChild>
              <Pressable style={styles.primaryBtn}>
                <Text style={styles.primaryText}>Submit recipe</Text>
              </Pressable>
            </Link>
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
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: typography.h4 },
  meta: { color: colors.textMuted },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    alignItems: "center",
    paddingVertical: 10,
  },
  ghostText: { color: colors.text, fontWeight: "700" },
  primaryBtn: {
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    paddingVertical: 10,
  },
  primaryText: { color: colors.bg, fontWeight: "700" },
});
