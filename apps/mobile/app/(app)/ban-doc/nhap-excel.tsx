import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { ApiError, type PatronImportResult, vi } from "@thuvien/shared";
import { patronsApi } from "../../../lib/resources";
import { useImportPatronsFromExcel } from "../../../hooks/use-patrons";

const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

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

export default function NhapExcelChungSinhScreen() {
  const router = useRouter();
  const importPatrons = useImportPatronsFromExcel();
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatronImportResult | null>(null);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleDownloadTemplate() {
    setError(null);
    setDownloading(true);
    try {
      const blob = await patronsApi.downloadImportTemplate();
      const base64 = await blobToBase64(blob);
      const fileUri = `${FileSystem.cacheDirectory}mau-nhap-chung-sinh.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: "base64" });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Lưu file mẫu",
        });
      }
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    } finally {
      setDownloading(false);
    }
  }

  async function handlePickFile() {
    setError(null);
    setResult(null);
    const res = await DocumentPicker.getDocumentAsync({
      type: EXCEL_MIME_TYPES,
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    setPickedFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  async function handleImport() {
    if (!pickedFile) return;
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("file", {
      uri: pickedFile.uri,
      name: pickedFile.name,
      type: pickedFile.mimeType,
    } as unknown as Blob);

    try {
      const res = await importPatrons.mutateAsync(formData);
      setResult(res);
      setPickedFile(null);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.patron.importExcel}</Text>

      <View style={{ marginTop: 14, backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14 }}>
        <Text style={{ fontSize: 13, color: "#475569" }}>
          Tải file mẫu Excel, điền thông tin độc giả theo đúng cột, rồi chọn file để nhập nhiều độc giả cùng lúc.
        </Text>
        <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{vi.patron.importDefaultPasswordNote}</Text>

        <Pressable
          onPress={handleDownloadTemplate}
          disabled={downloading}
          style={{ marginTop: 12, borderWidth: 1, borderColor: "#cbd5e1", paddingVertical: 10, borderRadius: 8, alignItems: "center" }}
        >
          {downloading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={{ color: "#334155", fontWeight: "600", fontSize: 13 }}>{vi.patron.downloadTemplate}</Text>
          )}
        </Pressable>

        <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 8 }}>
            {vi.patron.selectExcelFile}
          </Text>
          <Pressable
            onPress={handlePickFile}
            style={{ borderWidth: 1, borderColor: "#cbd5e1", borderStyle: "dashed", borderRadius: 8, padding: 14, alignItems: "center" }}
          >
            <Text style={{ fontSize: 13, color: pickedFile ? "#1e293b" : "#94a3b8" }}>
              {pickedFile ? pickedFile.name : vi.patron.selectExcelFile}
            </Text>
          </Pressable>

          {error && (
            <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12, fontSize: 13 }}>
              {error}
            </Text>
          )}

          <Pressable
            onPress={handleImport}
            disabled={!pickedFile || importPatrons.isPending}
            style={{
              marginTop: 14,
              backgroundColor: "#0f172a",
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              opacity: !pickedFile ? 0.5 : 1,
            }}
          >
            {importPatrons.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>{vi.patron.importSubmit}</Text>
            )}
          </Pressable>
        </View>
      </View>

      {result && (
        <View style={{ marginTop: 16, backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#1e293b" }}>{vi.patron.importResultTitle}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 10 }}>
            <Text style={{ fontSize: 13 }}>
              <Text style={{ fontWeight: "700", color: "#047857" }}>{result.successCount}</Text>{" "}
              <Text style={{ color: "#475569" }}>{vi.patron.importSuccessCount}</Text>
            </Text>
            <Text style={{ fontSize: 13 }}>
              <Text style={{ fontWeight: "700", color: "#b45309" }}>{result.duplicateCount}</Text>{" "}
              <Text style={{ color: "#475569" }}>{vi.patron.importDuplicateCount}</Text>
            </Text>
            <Text style={{ fontSize: 13 }}>
              <Text style={{ fontWeight: "700", color: "#dc2626" }}>{result.failedCount}</Text>{" "}
              <Text style={{ color: "#475569" }}>{vi.patron.importFailedCount}</Text>
            </Text>
          </View>

          {result.duplicates.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155" }}>
                {vi.patron.importDuplicatesTitle}
              </Text>
              {result.duplicates.map((dup, idx) => (
                <View key={idx} style={{ backgroundColor: "#fffbeb", borderRadius: 8, padding: 10, marginTop: 6 }}>
                  <Text style={{ fontSize: 12, color: "#b45309" }}>
                    {vi.patron.importRow} {dup.row}: {dup.studentCode}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginTop: 10 }}>
            {result.errors.length === 0 ? (
              <Text style={{ fontSize: 13, color: "#94a3b8" }}>{vi.patron.importNoErrors}</Text>
            ) : (
              result.errors.map((err, idx) => (
                <View key={idx} style={{ backgroundColor: "#fef2f2", borderRadius: 8, padding: 10, marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: "#b91c1c" }}>
                    {vi.patron.importRow} {err.row}
                    {err.studentCode ? ` (${err.studentCode})` : ""}: {err.message}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
