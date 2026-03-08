import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const suggestions = [
  { id: "s1", name: "Chef Ana", specialty: "Latin Fusion" },
  { id: "s2", name: "Marcus Grill", specialty: "Steak & Smoke" },
  { id: "s3", name: "Nori Bowl", specialty: "Japanese Home Cooking" },
];

const following = [
  { id: "f1", name: "Chef Marco", specialty: "Italian Classics" },
  { id: "f2", name: "BakeHouse Mia", specialty: "Pastry & Desserts" },
];

export default function MenuNetworkScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Network</Text>
      <Text style={styles.subtitle}>Manage who you follow and discover new cooks.</Text>

      <Text style={styles.sectionTitle}>Following</Text>
      {following.map((person) => (
        <View key={person.id} style={styles.card}>
          <View>
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.meta}>{person.specialty}</Text>
          </View>
          <Pressable style={styles.ghostBtn}>
            <Text style={styles.ghostText}>Following</Text>
          </Pressable>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Suggested cooks</Text>
      {suggestions.map((person) => (
        <View key={person.id} style={styles.card}>
          <View>
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.meta}>{person.specialty}</Text>
          </View>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Follow</Text>
          </Pressable>
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
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: typography.h4, marginTop: 6 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  name: { color: colors.text, fontWeight: "700", fontSize: typography.body },
  meta: { color: colors.textMuted, marginTop: 2 },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  primaryText: { color: colors.bg, fontWeight: "700" },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ghostText: { color: colors.text, fontWeight: "700" },
});
