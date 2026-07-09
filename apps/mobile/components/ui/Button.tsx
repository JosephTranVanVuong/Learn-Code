import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
export type ButtonSize = "sm" | "md";

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.navy, text: "#ffffff" },
  secondary: { bg: "#ffffff", text: colors.textPrimary, border: "#cbd5e1" },
  danger: { bg: "#ffffff", text: colors.danger, border: colors.dangerBorder },
  ghost: { bg: "transparent", text: colors.textSecondary },
  success: { bg: "#ffffff", text: colors.success, border: colors.successBorder },
};

const SIZE_STYLES: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 13 },
  md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 14 },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  loading,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          borderRadius: 8,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={s.fontSize + 3} color={v.text} />}
          <Text style={{ color: v.text, fontWeight: "600", fontSize: s.fontSize }}>{children}</Text>
        </>
      )}
    </Pressable>
  );
}
