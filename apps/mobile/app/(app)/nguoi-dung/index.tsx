import { useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { vi, type User } from "@thuvien/shared";
import { useUsers } from "../../../hooks/use-users";

export default function NguoiDungListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUsers({ search: search || undefined, page: 1, pageSize: 50 });

  function renderItem({ item, index }: { item: User; index: number }) {
    return (
      <Pressable
        onPress={() => router.push(`/(app)/nguoi-dung/${item.id}`)}
        style={{
          borderWidth: 1,
          borderColor: "#e2e8f0",
          borderRadius: 10,
          padding: 14,
          marginBottom: 10,
          backgroundColor: "white",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ width: 20, color: "#94a3b8", fontSize: 12 }}>{index + 1}.</Text>
            <View>
              <Text style={{ fontWeight: "600", color: "#1e293b" }}>{item.fullName}</Text>
              <Text style={{ color: "#64748b", marginTop: 2, fontSize: 12 }}>
                {item.email} · {vi.roles[item.role]}
              </Text>
            </View>
          </View>
          {!item.isActive && (
            <Text
              style={{
                fontSize: 11,
                color: "#64748b",
                backgroundColor: "#f1f5f9",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              {vi.user.inactive}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }}>
      <View style={{ paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.nav.users}</Text>
        <Pressable
          onPress={() => router.push("/(app)/nguoi-dung/moi")}
          style={{ backgroundColor: "#0f172a", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>{vi.user.addNew}</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={vi.user.searchPlaceholder}
          style={{
            borderWidth: 1,
            borderColor: "#cbd5e1",
            borderRadius: 8,
            padding: 10,
            backgroundColor: "white",
          }}
        />
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20 }}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#94a3b8", marginTop: 20 }}>
            {isLoading ? vi.common.loading : vi.user.noResults}
          </Text>
        }
      />
    </View>
  );
}
