import { useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { vi, type BookWithAvailability } from "@thuvien/shared";
import { useBooks } from "../../../hooks/use-books";
import { useCategories } from "../../../hooks/use-categories";
import { colors } from "../../../lib/theme";
import { BookGridItem } from "../../../components/book-grid-item";

export default function TraCuuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  const { data: categories } = useCategories();
  const { data, isLoading } = useBooks({
    search: search || undefined,
    categoryId: categoryId || undefined,
    availableOnly: availableOnly || undefined,
    page: 1,
    pageSize: 60,
  });

  function renderItem({ item }: { item: BookWithAvailability }) {
    return <BookGridItem book={item} onPress={() => router.push(`/(public)/tra-cuu/${item.id}`)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.navy, paddingTop: insets.top + 12, paddingBottom: 16, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 19, fontWeight: "700", color: "#ffffff" }}>{vi.publicCatalog.title}</Text>
            <Text style={{ color: colors.gold, marginTop: 2, fontSize: 12 }}>{vi.publicCatalog.subtitle}</Text>
          </View>
          <Pressable onPress={() => router.replace("/(auth)/dang-nhap")}>
            <Text style={{ color: "#ffffff", fontSize: 12, opacity: 0.8 }}>{vi.publicCatalog.backToLogin}</Text>
          </Pressable>
        </View>
      </View>

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
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
        columnWrapperStyle={{ gap: 12 }}
        numColumns={2}
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
