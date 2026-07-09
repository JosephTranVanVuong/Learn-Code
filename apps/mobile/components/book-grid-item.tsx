import { Image, Pressable, Text, View } from "react-native";
import type { BookWithAvailability } from "@thuvien/shared";
import { resolveAssetUrl } from "../lib/asset-url";
import { colors } from "../lib/theme";

export function BookGridItem({ book, onPress }: { book: BookWithAvailability; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          aspectRatio: 2 / 3,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: colors.border,
          borderWidth: 1,
          borderColor: colors.border,
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
              padding: 10,
            }}
          >
            <Text style={{ color: colors.gold, fontSize: 11, fontWeight: "600", textAlign: "center" }} numberOfLines={4}>
              {book.title}
            </Text>
          </View>
        )}
        <View
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            backgroundColor: book.availableCopies > 0 ? colors.success : colors.textMuted,
            borderRadius: 999,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "700" }}>
            {book.availableCopies}/{book.totalCopies}
          </Text>
        </View>
      </View>
      <Text numberOfLines={2} style={{ marginTop: 6, fontSize: 13, fontWeight: "600", color: colors.textPrimary }}>
        {book.title}
      </Text>
      <Text numberOfLines={1} style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
        {book.author.name}
      </Text>
    </Pressable>
  );
}
