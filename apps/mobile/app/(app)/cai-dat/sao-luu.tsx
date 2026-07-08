import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { ApiError, RESTORE_CONFIRM_PHRASE, vi, type BackupEntry } from "@thuvien/shared";
import { settingsApi } from "../../../lib/resources";
import {
  useBackups,
  useBackupSettings,
  useCreateBackup,
  useDeleteBackup,
  useRestoreBackupUpload,
  useRestoreFromBackup,
  useUpdateBackupSettings,
} from "../../../hooks/use-settings";

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function labelText(label: string): string {
  if (label === "manual") return vi.settings.backupLabelManual;
  if (label === "auto") return vi.settings.backupLabelAuto;
  return vi.settings.backupLabelOther;
}

type RestoreTarget = { kind: "history"; filename: string } | { kind: "upload"; uri: string; name: string; mimeType?: string };

export default function SaoLuuScreen() {
  const router = useRouter();
  const { data: backupSettings } = useBackupSettings();
  const updateBackupSettings = useUpdateBackupSettings();
  const { data: backups } = useBackups();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const restoreFromBackup = useRestoreFromBackup();
  const restoreUpload = useRestoreBackupUpload();

  const [autoEnabled, setAutoEnabled] = useState<boolean | null>(null);
  const [retentionInput, setRetentionInput] = useState<string | null>(null);
  const [downloadingFilename, setDownloadingFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<RestoreTarget | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const effectiveAutoEnabled = autoEnabled ?? backupSettings?.autoBackupEnabled ?? true;
  const effectiveRetention = retentionInput ?? String(backupSettings?.retentionCount ?? 7);
  const restoring = restoreFromBackup.isPending || restoreUpload.isPending;

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleSaveBackupSettings() {
    setError(null);
    setInfo(null);
    try {
      await updateBackupSettings.mutateAsync({
        autoBackupEnabled: effectiveAutoEnabled,
        retentionCount: Number(effectiveRetention) || 7,
      });
      setAutoEnabled(null);
      setRetentionInput(null);
      setInfo(`${vi.common.save} ✓`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleCreateBackup() {
    setError(null);
    setInfo(null);
    try {
      await createBackup.mutateAsync();
      setInfo(`${vi.settings.backupNow} ✓`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDownload(entry: BackupEntry) {
    setError(null);
    setDownloadingFilename(entry.filename);
    try {
      const blob = await settingsApi.downloadBackupFile(entry.filename);
      const base64 = await blobToBase64(blob);
      const fileUri = `${FileSystem.cacheDirectory}${entry.filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: "base64" });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: "Lưu file sao lưu" });
      }
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    } finally {
      setDownloadingFilename(null);
    }
  }

  function handleDelete(filename: string) {
    Alert.alert(vi.settings.backupDeleteConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.common.delete,
        style: "destructive",
        onPress: async () => {
          setError(null);
          try {
            await deleteBackup.mutateAsync(filename);
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  function openRestoreModal(target: RestoreTarget) {
    setRestoreTarget(target);
    setConfirmText("");
    setRestoreError(null);
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
    openRestoreModal({ kind: "upload", uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
  }

  function closeRestoreModal() {
    if (restoring) return;
    setRestoreTarget(null);
    setConfirmText("");
    setRestoreError(null);
  }

  async function handleConfirmRestore() {
    if (!restoreTarget) return;
    setRestoreError(null);
    if (confirmText !== RESTORE_CONFIRM_PHRASE) {
      setRestoreError(vi.settings.restoreConfirmPhraseMismatch);
      return;
    }
    try {
      if (restoreTarget.kind === "history") {
        await restoreFromBackup.mutateAsync({ filename: restoreTarget.filename, confirm: confirmText });
      } else {
        const formData = new FormData();
        formData.append("file", {
          uri: restoreTarget.uri,
          name: restoreTarget.name,
          type: restoreTarget.mimeType ?? "application/octet-stream",
        } as unknown as Blob);
        await restoreUpload.mutateAsync({ formData, confirm: confirmText });
      }
      setRestoreTarget(null);
      setConfirmText("");
      setInfo(vi.settings.restoreSuccess);
    } catch (err) {
      setRestoreError(extractMessage(err, vi.common.error));
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>
        {vi.settings.backup} / {vi.settings.restore}
      </Text>
      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{vi.settings.backupRestoreDesc}</Text>
      <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>{vi.settings.threeTwoOneTip}</Text>

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

      <View style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, backgroundColor: "white", marginBottom: 12 }}>
        <Text style={{ fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>{vi.settings.backupAutoSettings}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#334155", flex: 1 }}>{vi.settings.backupAutoEnabled}</Text>
          <Switch value={effectiveAutoEnabled} onValueChange={setAutoEnabled} />
        </View>
        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 4 }}>
          {vi.settings.backupRetentionCount}
        </Text>
        <TextInput
          value={effectiveRetention}
          onChangeText={setRetentionInput}
          keyboardType="number-pad"
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, width: 100, backgroundColor: "white" }}
        />
        <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{vi.settings.backupRetentionDesc}</Text>
        <Pressable
          onPress={handleSaveBackupSettings}
          disabled={updateBackupSettings.isPending}
          style={{ backgroundColor: "#0f172a", padding: 10, borderRadius: 8, marginTop: 12, opacity: updateBackupSettings.isPending ? 0.6 : 1 }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>{vi.common.save}</Text>
        </Pressable>
      </View>

      <View style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, backgroundColor: "white", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontWeight: "600", color: "#1e293b" }}>{vi.settings.backupHistory}</Text>
          <Pressable
            onPress={handleCreateBackup}
            disabled={createBackup.isPending}
            style={{ backgroundColor: "#0f172a", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, opacity: createBackup.isPending ? 0.6 : 1 }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>{vi.settings.backupNow}</Text>
          </Pressable>
        </View>

        {(!backups || backups.length === 0) && (
          <Text style={{ color: "#94a3b8", fontSize: 13 }}>{vi.settings.backupEmpty}</Text>
        )}
        {backups?.map((entry) => (
          <View key={entry.filename} style={{ borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingVertical: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ backgroundColor: "#f1f5f9", color: "#475569", fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                {labelText(entry.label)}
              </Text>
              <Text style={{ fontSize: 12, color: "#64748b" }}>{formatBytes(entry.sizeBytes)}</Text>
            </View>
            <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {new Date(entry.createdAt).toLocaleString("vi-VN")}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Pressable
                onPress={() => handleDownload(entry)}
                disabled={downloadingFilename === entry.filename}
                style={{ borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
              >
                <Text style={{ fontSize: 12, color: "#334155", fontWeight: "600" }}>{vi.settings.backupDownload}</Text>
              </Pressable>
              <Pressable
                onPress={() => openRestoreModal({ kind: "history", filename: entry.filename })}
                style={{ borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
              >
                <Text style={{ fontSize: 12, color: "#334155", fontWeight: "600" }}>{vi.settings.backupRestoreFromHistory}</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(entry.filename)}
                style={{ borderWidth: 1, borderColor: "#fecaca", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
              >
                <Text style={{ fontSize: 12, color: "#dc2626", fontWeight: "600" }}>{vi.common.delete}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, backgroundColor: "white" }}>
        <Text style={{ fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>{vi.settings.restoreSubmit}</Text>
        <Pressable
          onPress={handlePickRestoreFile}
          style={{ borderWidth: 1, borderColor: "#dc2626", padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: "#dc2626", textAlign: "center", fontWeight: "600" }}>{vi.settings.restoreFile}</Text>
        </Pressable>
      </View>

      <Modal visible={restoreTarget !== null} transparent animationType="fade" onRequestClose={closeRestoreModal}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "white", borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b" }}>{vi.settings.restore}</Text>
            <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12, fontSize: 13 }}>
              {vi.settings.restoreConfirm}
            </Text>
            {restoreTarget?.kind === "upload" && (
              <Text style={{ fontSize: 13, color: "#334155", marginTop: 10 }}>
                {vi.settings.restoreFile}: <Text style={{ fontWeight: "600" }}>{restoreTarget.name}</Text>
              </Text>
            )}
            <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 4 }}>
              {vi.settings.restoreConfirmPhraseLabel}
            </Text>
            <TextInput
              autoFocus
              value={confirmText}
              onChangeText={setConfirmText}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
            />
            {restoreError && (
              <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12 }}>
                {restoreError}
              </Text>
            )}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
              <Pressable onPress={closeRestoreModal} disabled={restoring}>
                <Text style={{ color: "#64748b", fontWeight: "600" }}>{vi.common.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmRestore}
                disabled={restoring || confirmText !== RESTORE_CONFIRM_PHRASE}
                style={{
                  backgroundColor: "#dc2626",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  opacity: restoring || confirmText !== RESTORE_CONFIRM_PHRASE ? 0.5 : 1,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>{vi.settings.restore}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
