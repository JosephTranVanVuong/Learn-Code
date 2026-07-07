import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { vi } from "@thuvien/shared";

const SETTINGS_ITEMS = [
  { href: "/(app)/cai-dat/thong-tin-thu-vien", label: vi.settings.libraryInfo },
  { href: "/(app)/cai-dat/loai-doc-gia", label: vi.settings.patronTypes },
  { href: "/(app)/cai-dat/quy-dinh-muon", label: vi.settings.loanPolicy },
  { href: "/(app)/cai-dat/muc-phat", label: vi.settings.finePolicy },
  { href: "/(app)/cai-dat/barcode", label: vi.settings.barcode },
  { href: "/(app)/cai-dat/email", label: vi.settings.email },
  { href: "/(app)/cai-dat/sao-luu", label: `${vi.settings.backup} / ${vi.settings.restore}` },
  { href: "/(app)/cai-dat/xoa-du-lieu", label: vi.settings.deleteData },
] as const;

export default function CaiDatScreen() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 16 }}>{vi.settings.title}</Text>
      <View style={{ gap: 10 }}>
        {SETTINGS_ITEMS.map((item) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href)}
            style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", padding: 14, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: "600", color: "#1e293b" }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
