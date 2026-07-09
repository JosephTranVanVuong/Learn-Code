import { Text, View } from "react-native";
import { colors } from "../../lib/theme";

export type BadgeTone = "neutral" | "gold" | "success" | "danger";

const TONE_STYLES: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: "#f1f5f9", text: colors.textSecondary },
  gold: { bg: colors.goldBg, text: colors.navy },
  success: { bg: colors.successBg, text: colors.successText },
  danger: { bg: colors.dangerBg, text: colors.dangerText },
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  const t = TONE_STYLES[tone];
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: t.text, fontSize: 11, fontWeight: "700" }}>{children}</Text>
    </View>
  );
}
