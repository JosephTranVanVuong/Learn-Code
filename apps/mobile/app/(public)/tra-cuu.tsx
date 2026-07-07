import { useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { vi, type BookWithAvailability } from "@thuvien/shared";
import { useBooks } from "../../hooks/use-books";
import { useCategories } from "../../hooks/use-categories";

export default function TraCuuScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const { data: categories } = useCategories();
  const { data, isLoading } = useBooks({
    search: search || undefined,
    categoryId: categoryId || undefined,
    page: 1,
    pageSize: 50,
  });

  function renderItem({ item, index }: { item: BookWithAvailability; index: number }) {
    return (
      <View
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
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }}>
      <View style={{ paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.publicCatalog.title}</Text>
          <Text style={{ color: "#64748b", marginTop: 2, fontSize: 12 }}>{vi.publicCatalog.subtitle}</Text>
        </View>
        <Pressable onPress={() => router.replace("/(auth)/dang-nhap")}>
          <Text style={{ color: "#64748b", fontSize: 13 }}>{vi.publicCatalog.backToLogin}</Text>
        </Pressable>
      </View>

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
