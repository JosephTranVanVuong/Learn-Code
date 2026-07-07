import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack, usePathname } from "expo-router";
import { ADMIN_ROLES, STAFF_ROLES } from "@thuvien/shared";
import { useAuth } from "../../lib/auth-context";

const STAFF_ONLY_PATHS = [
  "/the-loai",
  "/tac-gia",
  "/ban-doc",
  "/muon-tra",
  "/phat",
  "/thong-bao",
  "/bao-cao",
  "/sach/moi",
  "/sach/nhap-excel",
];

const ADMIN_ONLY_PATHS = ["/nguoi-dung", "/cai-dat"];

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

  return <Stack screenOptions={{ headerShown: false }} />;
}
