import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { vi } from "@thuvien/shared";
import { useBook } from "../../../hooks/use-books";
import { resolveAssetUrl } from "../../../lib/asset-url";
import { colors } from "../../../lib/theme";
import { Badge } from "../../../components/ui/Badge";

function commonCopyLocation(copies: { location: string | null }[]): string | null {
  const withLocation = copies.filter((c) => c.location);
  if (withLocation.length === 0) return null;
  const first = withLocation[0].location;
  return withLocation.every((c) => c.location === first) ? first : null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

export default function ChiTietSachCongKhaiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: book, isLoading } = useBook(id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.navy, paddingTop: insets.top + 12, paddingBottom: 14, paddingHorizontal: 16 }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="chevron-back" size={20} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 14 }}>{vi.publicCatalog.backToSearch}</Text>
        </Pressable>
      </View>

      {isLoading && (
        <Text style={{ textAlign: "center", color: colors.textMuted, marginTop: 24 }}>{vi.common.loading}</Text>
      )}
      {!isLoading && !book && (
        <Text style={{ textAlign: "center", color: colors.textMuted, marginTop: 24 }}>{vi.book.notFound}</Text>
      )}

      {book && (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View
              style={{
                width: 130,
                aspectRatio: 2 / 3,
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.border,
              }}
            >
              {book.coverImageUrl ? (
                <Image
                  source={{ uri: resolveAssetUrl(book.coverImageUrl) ?? undefined }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.navy,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 11, fontWeight: "600", textAlign: "center" }}>
                    {book.title}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy }}>{book.title}</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{book.author.name}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                <Badge tone="gold">{book.category.name}</Badge>
                <Badge tone={book.availableCopies > 0 ? "success" : "neutral"}>
                  {book.availableCopies}/{book.totalCopies} {vi.book.availability}
                </Badge>
              </View>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 20, paddingTop: 4 }}>
            {book.publisher && <InfoRow label={vi.book.publisher} value={book.publisher} />}
            {book.publishedYear && <InfoRow label={vi.book.publishedYear} value={String(book.publishedYear)} />}
            {book.isbn && <InfoRow label={vi.book.isbn} value={book.isbn} />}
            {book.language && <InfoRow label={vi.book.language} value={book.language} />}
            {commonCopyLocation(book.copies) && (
              <InfoRow label={vi.copy.location} value={commonCopyLocation(book.copies) ?? ""} />
            )}
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16, paddingTop: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.book.description}</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
              {book.description || vi.book.noDescription}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
