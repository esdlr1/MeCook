import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme/tokens";

type SectionHeaderProps = {
  title: string;
  rightText?: string;
};

export function SectionHeader({ title, rightText }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: typography.h4,
  },
  rightText: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
});
