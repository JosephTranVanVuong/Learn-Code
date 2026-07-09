import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, FlatList, Image, Pressable, Text, TextInput, View } from "react-native";
import { ApiError, vi, type Patron } from "@thuvien/shared";
import { resolveAssetUrl } from "../../../lib/asset-url";
import { patronsApi } from "../../../lib/resources";
import { usePatrons } from "../../../hooks/use-patrons";
import { BarcodeScannerModal } from "../../../components/barcode-scanner-modal";

export default function BanDocListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const { data, isLoading } = usePatrons({ search: search || undefined, page: 1, pageSize: 50 });

  async function handleScanned(code: string) {
    setScanning(false);
    try {
      const patron = await patronsApi.getByCode(code);
      router.push(`/(app)/ban-doc/${patron.id}`);
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { message?: string } | null) : null;
      Alert.alert(vi.common.error, body?.message ?? vi.patron.cardNotFound);
    }
  }

  function renderItem({ item, index }: { item: Patron; index: number }) {
    return (
      <Pressable
        onPress={() => router.push(`/(app)/ban-doc/${item.id}`)}
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
            {item.avatarUrl ? (
              <Image
                source={{ uri: resolveAssetUrl(item.avatarUrl) ?? undefined }}
                style={{ width: 32, height: 48, borderRadius: 6, backgroundColor: "#e2e8f0" }}
              />
            ) : (
              <View
                style={{
                  width: 32,
                  height: 48,
                  borderRadius: 6,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#94a3b8" }}>
                  {item.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={{ fontWeight: "600", color: "#1e293b" }}>{item.fullName}</Text>
              <Text style={{ color: "#64748b", marginTop: 2, fontSize: 12 }}>
                {item.studentCode} {item.className ? `· ${item.className}` : ""}
                {item.patronTypeName ? ` · ${item.patronTypeName}` : ""}
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
              {vi.patron.inactive}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }}>
      <View style={{ paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.nav.patrons}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => router.push("/(app)/ban-doc/nhap-excel")}
            style={{ borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: "#334155", fontWeight: "600", fontSize: 13 }}>{vi.patron.importExcel}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(app)/ban-doc/moi")}
            style={{ backgroundColor: "#0f172a", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>{vi.patron.addNew}</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 14, flexDirection: "row", gap: 8 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={vi.patron.searchPlaceholder}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#cbd5e1",
            borderRadius: 8,
            padding: 10,
            backgroundColor: "white",
          }}
        />
        <Pressable
          onPress={() => setScanning(true)}
          style={{
            borderWidth: 1,
            borderColor: "#cbd5e1",
            borderRadius: 8,
            paddingHorizontal: 14,
            justifyContent: "center",
            backgroundColor: "white",
          }}
        >
          <Text style={{ color: "#334155", fontWeight: "600", fontSize: 13 }}>{vi.patron.scanSearch}</Text>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20 }}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#94a3b8", marginTop: 20 }}>
            {isLoading ? vi.common.loading : vi.patron.noResults}
          </Text>
        }
      />

      <BarcodeScannerModal
        visible={scanning}
        title={vi.patron.scanSearch}
        onScanned={handleScanned}
        onClose={() => setScanning(false)}
      />
    </View>
  );
}
