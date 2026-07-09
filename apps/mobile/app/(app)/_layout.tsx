import { ActivityIndicator, View } from "react-native";
import { Redirect, Tabs, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_ROLES, STAFF_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "../../lib/auth-context";
import { colors } from "../../lib/theme";

const STAFF_ONLY_PATHS = [
  "/the-loai",
  "/tac-gia",
  "/ban-doc",
  "/muon-tra",
  "/phat",
  "/thong-bao",
  "/bao-cao",
  "/them",
  "/sach/moi",
  "/sach/nhap-excel",
];

const ADMIN_ONLY_PATHS = ["/nguoi-dung", "/cai-dat"];

function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;
}

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/dang-nhap" />;
  }

  if (!STAFF_ROLES.includes(user.role) && STAFF_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    return <Redirect href="/(app)/tong-quan" />;
  }

  if (!ADMIN_ROLES.includes(user.role) && ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    return <Redirect href="/(app)/tong-quan" />;
  }

  const isStaff = STAFF_ROLES.includes(user.role);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.navy, borderTopWidth: 0 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="tong-quan"
        options={{ title: vi.nav.dashboard, tabBarIcon: tabIcon("home") }}
      />
      <Tabs.Screen
        name="muon-tra"
        options={{
          title: vi.nav.loans,
          href: isStaff ? undefined : null,
          headerShown: true,
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "700" },
          tabBarIcon: tabIcon("swap-horizontal"),
        }}
      />
      <Tabs.Screen name="sach" options={{ title: vi.nav.books, tabBarIcon: tabIcon("book") }} />
      <Tabs.Screen
        name="ban-doc"
        options={{ title: vi.nav.patrons, href: isStaff ? undefined : null, tabBarIcon: tabIcon("people") }}
      />
      <Tabs.Screen
        name="them"
        options={{ title: vi.nav.more, href: isStaff ? undefined : null, tabBarIcon: tabIcon("menu") }}
      />

      {/* Reachable via router.push từ tab "Thêm", không hiện icon riêng trên thanh tab */}
      <Tabs.Screen name="the-loai" options={{ href: null }} />
      <Tabs.Screen name="tac-gia" options={{ href: null }} />
      <Tabs.Screen name="phat" options={{ href: null }} />
      <Tabs.Screen name="thong-bao" options={{ href: null }} />
      <Tabs.Screen name="bao-cao" options={{ href: null }} />
      <Tabs.Screen name="nguoi-dung" options={{ href: null }} />
      <Tabs.Screen name="cai-dat" options={{ href: null }} />
    </Tabs>
  );
}
