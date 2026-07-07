import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { ApiError, STAFF_ROLES, vi, type BookWithAvailability } from "@thuvien/shared";
import { useAuth } from "../../../lib/auth-context";
import { booksApi } from "../../../lib/resources";
import { useBooks } from "../../../hooks/use-books";
import { useCategories } from "../../../hooks/use-categories";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(blob);
  });
}

export default function SachListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data, isLoading } = useBooks({
    search: search || undefined,
    categoryId: categoryId || undefined,
    page: 1,
    pageSize: 50,
  });

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      const blob = await booksApi.exportAllBooks();
      const base64 = await blobToBase64(blob);
      const fileUri = `${FileSystem.cacheDirectory}danh-sach-sach.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: "base64" });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Lưu danh sách sách",
        });
      }
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { message?: string } | null) : null;
      setExportError(body?.message ?? vi.common.error);
    } finally {
      setExporting(false);
    }
  }

  function renderItem({ item, index }: { item: BookWithAvailability; index: number }) {
    return (
      <Pressable
        onPress={() => router.push(`/(app)/sach/${item.id}`)}
        style={{
          borderWidth: 1,
          borderColor: "#e2e8f0",
          borderRadius: 10,
          padding: 14,
          marginBottom: 10,
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontWeight: "600", color: "#1e293b" }}>
          <Text style={{ color: "#94a3b8" }}>{index + 1}. </Text>
          {item.title}
        </Text>
        <Text style={{ color: "#64748b", marginTop: 2 }}>{item.author.name}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: "#94a3b8" }}>{item.category.name}</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: item.availableCopies > 0 ? "#047857" : "#64748b",
            }}
          >
            {item.availableCopies}/{item.totalCopies} {vi.book.availability}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }}>
      <View style={{ paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.nav.books}</Text>
        {isStaff && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={handleExport}
              disabled={exporting}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            >
              {exporting ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={{ color: "#334155", fontWeight: "600", fontSize: 13 }}>{vi.book.exportExcel}</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/sach/nhap-excel")}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            >
              <Text style={{ color: "#334155", fontWeight: "600", fontSize: 13 }}>{vi.book.importExcel}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/sach/moi")}
              style={{ backgroundColor: "#0f172a", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>{vi.book.addNew}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {exportError && (
        <Text
          style={{
            marginHorizontal: 20,
            marginTop: 10,
            color: "#b91c1c",
            backgroundColor: "#fef2f2",
            padding: 10,
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {exportError}
        </Text>
      )}

      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={vi.book.searchPlaceholder}
          style={{
            borderWidth: 1,
            borderColor: "#cbd5e1",
            borderRadius: 8,
            padding: 10,
            backgroundColor: "white",
          }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <Pressable
            onPress={() => setCategoryId("")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              marginRight: 8,
              backgroundColor: categoryId === "" ? "#0f172a" : "#e2e8f0",
            }}
          >
            <Text style={{ color: categoryId === "" ? "white" : "#334155", fontSize: 12 }}>
              {vi.book.allCategories}
            </Text>
          </Pressable>
          {categories?.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                marginRight: 8,
                backgroundColor: categoryId === cat.id ? "#0f172a" : "#e2e8f0",
              }}
            >
              <Text style={{ color: categoryId === cat.id ? "white" : "#334155", fontSize: 12 }}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 20 }}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#94a3b8", marginTop: 20 }}>
            {isLoading ? vi.common.loading : vi.book.noResults}
          </Text>
        }
      />
    </View>
  );
}
