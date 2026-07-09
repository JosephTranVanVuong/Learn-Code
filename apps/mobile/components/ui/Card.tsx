import { View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../../lib/theme";

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
