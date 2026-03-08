import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../../theme/tokens";

type IngredientCardProps = {
  name: string;
  image: string;
  onPress?: () => void;
};

export function IngredientCard({ name, image, onPress }: IngredientCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={image} style={styles.image} contentFit="cover" />
      <View style={styles.overlay} />
      <Text style={styles.name}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    height: 110,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: 10,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  name: {
    position: "absolute",
    bottom: 8,
    left: 8,
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
});
