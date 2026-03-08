import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { colors, radius } from "../../theme/tokens";

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = "Type ingredients..." }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={22} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    height: 52,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#0A0A0A",
  },
  input: {
    color: colors.text,
    fontSize: 18,
    flex: 1,
  },
});
