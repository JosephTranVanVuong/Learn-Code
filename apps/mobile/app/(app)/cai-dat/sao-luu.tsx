import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { ApiError, vi } from "@thuvien/shared";
import { settingsApi } from "../../../lib/resources";

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

export default function SaoLuuScreen() {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleDownload() {
    setError(null);
    setDownloading(true);
    try {
      const blob = await settingsApi.downloadBackup();
      const base64 = await blobToBase64(blob);
      const fileUri = `${FileSystem.cacheDirectory}sao-luu-${new Date().toISOString().slice(0, 10)}.db`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: "base64" });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: "Lưu file sao lưu" });
      }
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    } finally {
      setDownloading(false);
    }
  }

  async function handlePickRestoreFile() {
    setError(null);
    setInfo(null);
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.name.endsWith(".db")) {
      setError(vi.settings.restoreInvalidFile);
      return;
    }

    Alert.alert(vi.settings.restoreConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.settings.restoreSubmit,
        style: "destructive",
        onPress: async () => {
          setRestoring(true);
          try {
            const formData = new FormData();
            formData.append("file", {
              uri: asset.uri,
              name: asset.name,
              type: asset.mimeType ?? "application/octet-stream",
            } as unknown as Blob);
            await settingsApi.restoreBackup(formData);
            setInfo(vi.settings.restoreSuccess);
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          } finally {
            setRestoring(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>
        {vi.settings.backup} / {vi.settings.restore}
      </Text>
      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>
        {vi.settings.backupRestoreDesc}
      </Text>

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

      <View
        style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, backgroundColor: "white", marginBottom: 12 }}
      >
        <Text style={{ fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>{vi.settings.backup}</Text>
        <Pressable
          onPress={handleDownload}
          disabled={downloading}
          style={{ backgroundColor: "#0f172a", padding: 12, borderRadius: 8, opacity: downloading ? 0.6 : 1 }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
            {downloading ? vi.common.loading : vi.settings.downloadBackup}
          </Text>
        </Pressable>
      </View>

      <View
        style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, backgroundColor: "white" }}
      >
        <Text style={{ fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>{vi.settings.restore}</Text>
        <Pressable
          onPress={handlePickRestoreFile}
          disabled={restoring}
          style={{ borderWidth: 1, borderColor: "#dc2626", padding: 12, borderRadius: 8, opacity: restoring ? 0.6 : 1 }}
        >
          <Text style={{ color: "#dc2626", textAlign: "center", fontWeight: "600" }}>
            {restoring ? vi.common.loading : vi.settings.restoreFile}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
