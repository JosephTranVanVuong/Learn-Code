import { useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { ApiError, STAFF_ROLES, vi, type BookWithAvailability } from "@thuvien/shared";
import { useAuth } from "../../../lib/auth-context";
import { booksApi } from "../../../lib/resources";
import { resolveAssetUrl } from "../../../lib/asset-url";
import { colors } from "../../../lib/theme";
import { useBooks } from "../../../hooks/use-books";
import { useCategories } from "../../../hooks/use-categories";
import { BookGridItem } from "../../../components/book-grid-item";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

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

function BookListRow({ book, onPress }: { book: BookWithAvailability; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 10,
      }}
    >
      <View style={{ width: 44, height: 60, borderRadius: 6, overflow: "hidden", backgroundColor: colors.border }}>
        {book.coverImageUrl ? (
          <Image
            source={{ uri: resolveAssetUrl(book.coverImageUrl) ?? undefined }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.navy }} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontWeight: "700", color: colors.textPrimary, fontSize: 14 }}>
          {book.title}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {book.author.name} · {book.category.name}
        </Text>
      </View>
      <Badge tone={book.availableCopies > 0 ? "success" : "neutral"}>
        {book.availableCopies}/{book.totalCopies}
      </Badge>
    </Pressable>
  );
}

export default function SachListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data, isLoading } = useBooks({
    search: search || undefined,
    categoryId: categoryId || undefined,
    availableOnly: availableOnly || undefined,
    page: 1,
    pageSize: 60,
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

  function renderItem({ item }: { item: BookWithAvailability }) {
    if (isStaff) {
      return <BookListRow book={item} onPress={() => router.push(`/(app)/sach/${item.id}`)} />;
    }
    return <BookGridItem book={item} onPress={() => router.push(`/(app)/sach/${item.id}`)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.navy, paddingTop: insets.top + 12, paddingBottom: 14, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 19, fontWeight: "700", color: "#ffffff" }}>{vi.nav.books}</Text>
        {isStaff && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <Button
              variant="secondary"
              size="sm"
              onPress={handleExport}
              disabled={exporting}
              loading={exporting}
            >
              {vi.book.exportExcel}
            </Button>
            <Button variant="secondary" size="sm" onPress={() => router.push("/(app)/sach/nhap-excel")}>
              {vi.book.importExcel}
            </Button>
            <Button icon="add" size="sm" onPress={() => router.push("/(app)/sach/moi")}>
              {vi.book.addNew}
            </Button>
          </View>
        )}
      </View>

      {exportError && (
        <Text
          style={{
            marginHorizontal: 16,
            marginTop: 10,
            color: colors.dangerText,
            backgroundColor: colors.dangerBg,
            padding: 10,
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {exportError}
        </Text>
      )}

      <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
        <View style={{ position: "relative" }}>
          <Ionicons
            name="search-outline"
            size={16}
            color={colors.textMuted}
            style={{ position: "absolute", left: 10, top: 12, zIndex: 1 }}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={vi.book.searchPlaceholder}
            style={{
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 8,
              paddingVertical: 10,
              paddingLeft: 32,
              paddingRight: 10,
              backgroundColor: "#ffffff",
              fontSize: 14,
            }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <Pressable
            onPress={() => setCategoryId("")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              marginRight: 8,
              backgroundColor: categoryId === "" ? colors.navy : "#e2e8f0",
            }}
          >
            <Text style={{ color: categoryId === "" ? "#ffffff" : colors.textPrimary, fontSize: 12, fontWeight: "600" }}>
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
                backgroundColor: categoryId === cat.id ? colors.navy : "#e2e8f0",
              }}
            >
              <Text
                style={{
                  color: categoryId === cat.id ? "#ffffff" : colors.textPrimary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          onPress={() => setAvailableOnly((v) => !v)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}
        >
          <Ionicons
            name={availableOnly ? "checkbox" : "square-outline"}
            size={18}
            color={availableOnly ? colors.navy : colors.textMuted}
          />
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>{vi.book.availableOnly}</Text>
        </Pressable>

        {!isLoading && data && (
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
            {data.total} {vi.book.resultsFound}
          </Text>
        )}
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: isStaff ? 8 : 16 }}
        columnWrapperStyle={isStaff ? undefined : { gap: 12 }}
        numColumns={isStaff ? 1 : 2}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: colors.textMuted, marginTop: 20 }}>
            {isLoading ? vi.common.loading : vi.book.noResults}
          </Text>
        }
      />
    </View>
  );
}
