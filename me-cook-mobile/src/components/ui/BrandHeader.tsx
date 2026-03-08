import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { meCookLogoSource, brandName } from "../../theme/brand";
import { colors, spacing, typography } from "../../theme/tokens";

type BrandHeaderProps = {
  subtitle?: string;
};

export function BrandHeader({ subtitle }: BrandHeaderProps) {
  return (
    <View style={styles.container}>
      <Image source={meCookLogoSource} style={styles.logo} contentFit="contain" />
      <View>
        <Text style={styles.title}>{brandName}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    marginTop: 2,
  },
});
