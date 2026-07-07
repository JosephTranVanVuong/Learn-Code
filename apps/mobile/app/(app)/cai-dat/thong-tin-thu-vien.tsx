import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ApiError, vi } from "@thuvien/shared";
import { resolveAssetUrl } from "../../../lib/asset-url";
import {
  useLibrarySettings,
  useRemoveLibraryLogo,
  useUpdateLibrarySettings,
  useUploadLibraryLogo,
} from "../../../hooks/use-settings";

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
      />
    </View>
  );
}

export default function ThongTinThuVienScreen() {
  const router = useRouter();
  const { data: settings, isLoading } = useLibrarySettings();
  const updateSettings = useUpdateLibrarySettings();
  const uploadLogo = useUploadLibraryLogo();
  const removeLogo = useRemoveLibraryLogo();

  const [form, setForm] = useState<{ name: string; address: string; phone: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (settings && !form) {
      setForm({
        name: settings.name,
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
      });
    }
  }, [settings, form]);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleSave() {
    if (!form) return;
    setError(null);
    setInfo(null);
    try {
      await updateSettings.mutateAsync(form);
      setInfo(vi.settings.saved);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handlePickLogo() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Cần cấp quyền truy cập thư viện ảnh");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const type = asset.mimeType ?? (ext === "png" ? "image/png" : "image/jpeg");
    const formData = new FormData();
    formData.append("file", { uri: asset.uri, name: asset.fileName ?? `logo.${ext}`, type } as unknown as Blob);

    try {
      await uploadLogo.mutateAsync(formData);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleRemoveLogo() {
    setError(null);
    try {
      await removeLogo.mutateAsync();
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  if (isLoading || !form) {
    return (
      <View style={{ flex: 1, paddingTop: 80, backgroundColor: "#f8fafc" }}>
        <Text style={{ textAlign: "center", color: "#94a3b8" }}>{vi.common.loading}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 16 }}>
          {vi.settings.libraryInfo}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
          {settings?.logoUrl ? (
            <Image
              source={{ uri: resolveAssetUrl(settings.logoUrl) ?? undefined }}
              style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: "#e2e8f0" }}
              resizeMode="contain"
            />
          ) : (
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#cbd5e1",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 10, color: "#94a3b8" }}>{vi.settings.noLogo}</Text>
            </View>
          )}
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={handlePickLogo}
              style={{ backgroundColor: "#0f172a", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            >
              <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                {settings?.logoUrl ? vi.settings.changeLogo : vi.settings.uploadLogo}
              </Text>
            </Pressable>
            {settings?.logoUrl && (
              <Pressable
                onPress={handleRemoveLogo}
                style={{ borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>{vi.settings.removeLogo}</Text>
              </Pressable>
            )}
          </View>
        </View>

        <Field label={vi.settings.libraryName} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <Field
          label={vi.settings.libraryAddress}
          value={form.address}
          onChangeText={(v) => setForm({ ...form, address: v })}
        />
        <Field label={vi.settings.libraryPhone} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
        <Field label={vi.settings.libraryEmail} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />

        {error && (
          <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginBottom: 12 }}>
            {error}
          </Text>
        )}
        {info && (
          <Text style={{ color: "#047857", backgroundColor: "#ecfdf5", padding: 10, borderRadius: 8, marginBottom: 12 }}>
            {info}
          </Text>
        )}

        <Pressable
          onPress={handleSave}
          disabled={updateSettings.isPending}
          style={{ backgroundColor: "#0f172a", padding: 12, borderRadius: 8, opacity: updateSettings.isPending ? 0.6 : 1 }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>{vi.common.save}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
