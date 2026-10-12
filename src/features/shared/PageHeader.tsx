import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "../../components";
import { colors, spacing } from "../../theme";

export function PageHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <IconButton
        accessibilityLabel="Volver"
        variant="plain"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      >
        <ArrowLeft color={colors.text} size={22} />
      </IconButton>
      <Text role="title" style={styles.copy}>
        {title}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  copy: { flex: 1 },
});
