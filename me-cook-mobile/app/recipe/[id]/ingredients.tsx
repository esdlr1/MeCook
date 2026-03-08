import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { requestJson } from "../../../src/lib/api";
import type { RecipeDetail } from "../../../src/types/api";
import { colors, spacing, typography } from "../../../src/theme/tokens";

export default function RecipeIngredientsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeQuery = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => requestJson<RecipeDetail>(`/api/recipes/${encodeURIComponent(id ?? "")}`),
    enabled: !!id,
  });
  const recipe = recipeQuery.data;

  return (
    <View style={styles.screen}>
      <Text style={styles.headline}>Ingredients for {recipe?.title ?? id?.replaceAll("-", " ")}</Text>
      <FlatList
        data={recipe?.ingredients ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>
              {item.quantity ? `${item.quantity} ` : ""}
              {item.unit ? `${item.unit} ` : ""}
              {item.itemName}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headline: {
    color: colors.text,
    fontSize: typography.h4,
    fontWeight: "700",
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  itemText: {
    color: colors.text,
    fontSize: typography.body,
  },
});
