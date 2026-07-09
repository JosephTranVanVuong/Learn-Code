import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ADMIN_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "../../lib/auth-context";
import { colors } from "../../lib/theme";

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: colors.goldBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={17} color={colors.navy} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: "500" }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ThemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const isAdmin = user ? ADMIN_ROLES.includes(user.role) : false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.navy, paddingTop: insets.top + 12, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#ffffff" }}>{vi.nav.more}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", marginHorizontal: 16, borderWidth: 1, borderColor: colors.border }}>
          <MenuRow icon="cash-outline" label={vi.nav.fines} onPress={() => router.push("/(app)/phat")} />
          <MenuRow icon="bar-chart-outline" label={vi.nav.reports} onPress={() => router.push("/(app)/bao-cao")} />
          <MenuRow icon="pricetag-outline" label={vi.nav.categories} onPress={() => router.push("/(app)/the-loai")} />
          <MenuRow icon="person-outline" label={vi.nav.authors} onPress={() => router.push("/(app)/tac-gia")} />
          <MenuRow icon="mail-outline" label={vi.nav.notifications} onPress={() => router.push("/(app)/thong-bao")} />
        </View>

        {isAdmin && (
          <View
            style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", marginHorizontal: 16, borderWidth: 1, borderColor: colors.border }}
          >
            <MenuRow icon="people-circle-outline" label={vi.nav.users} onPress={() => router.push("/(app)/nguoi-dung")} />
            <MenuRow icon="settings-outline" label={vi.nav.settings} onPress={() => router.push("/(app)/cai-dat")} />
          </View>
        )}

        <Pressable
          onPress={async () => {
            await logout();
            router.replace("/(auth)/dang-nhap");
          }}
          style={{
            marginTop: 24,
            marginHorizontal: 16,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: colors.dangerBorder,
            borderRadius: 10,
            padding: 14,
          }}
        >
          <Text style={{ color: colors.danger, textAlign: "center", fontWeight: "700", fontSize: 14 }}>
            {vi.nav.logout}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
