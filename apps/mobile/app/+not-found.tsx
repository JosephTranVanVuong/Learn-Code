import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Không tìm thấy" }} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1e293b" }}>Không tìm thấy trang</Text>
        <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>
          Màn hình bạn tìm không tồn tại.
        </Text>
        <Link href="/" style={{ color: "#0f172a", fontWeight: "600" }}>
          Về trang chính
        </Link>
      </View>
    </>
  );
}
