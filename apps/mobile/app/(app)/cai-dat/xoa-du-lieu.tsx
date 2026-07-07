import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, DELETE_ALL_CONFIRMATION_PHRASE, vi } from "@thuvien/shared";
import {
  useDeleteAllData,
  useDeleteBooksData,
  useDeleteCategoriesAuthorsData,
  useDeleteLoansFines,
  useDeletePatronsData,
} from "../../../hooks/use-data-management";

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | null;
    return body?.message ?? fallback;
  }
  return fallback;
}

function DeleteRow({
  title,
  desc,
  confirmText,
  onConfirm,
  pending,
}: {
  title: string;
  desc: string;
  confirmText: string;
  onConfirm: () => Promise<void>;
  pending: boolean;
}) {
  function handlePress() {
    Alert.alert(confirmText, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      { text: vi.common.delete, style: "destructive", onPress: onConfirm },
    ]);
  }

  return (
    <View style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, backgroundColor: "white" }}>
      <Text style={{ fontWeight: "600", color: "#1e293b" }}>{title}</Text>
      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 10 }}>{desc}</Text>
      <Pressable
        onPress={handlePress}
        disabled={pending}
        style={{ borderWidth: 1, borderColor: "#dc2626", padding: 10, borderRadius: 8, opacity: pending ? 0.6 : 1 }}
      >
        <Text style={{ color: "#dc2626", textAlign: "center", fontWeight: "600", fontSize: 13 }}>
          {pending ? vi.common.loading : title}
        </Text>
      </Pressable>
    </View>
  );
}

export default function XoaDuLieuScreen() {
  const router = useRouter();
  const deleteLoansFines = useDeleteLoansFines();
  const deletePatrons = useDeletePatronsData();
  const deleteBooks = useDeleteBooksData();
  const deleteCategoriesAuthors = useDeleteCategoriesAuthorsData();
  const deleteAll = useDeleteAllData();

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [password, setPassword] = useState("");

  async function handleDeleteLoansFines() {
    setError(null);
    setInfo(null);
    try {
      const result = await deleteLoansFines.mutateAsync();
      setInfo(`${result.deletedLoans} ${vi.settings.deleteResultLoans}, ${result.deletedFines} ${vi.settings.deleteResultFines}`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeletePatrons() {
    setError(null);
    setInfo(null);
    try {
      const result = await deletePatrons.mutateAsync();
      setInfo(`${result.deletedPatrons} ${vi.settings.deleteResultPatrons}`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeleteBooks() {
    setError(null);
    setInfo(null);
    try {
      const result = await deleteBooks.mutateAsync();
      setInfo(`${result.deletedBooks} ${vi.settings.deleteResultBooks}`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeleteCategoriesAuthors() {
    setError(null);
    setInfo(null);
    try {
      await deleteCategoriesAuthors.mutateAsync();
      setInfo(vi.settings.deleteSuccess);
    } catch (err) {
      setError(extractMessage(err, vi.settings.deleteCategoriesAuthorsBlocked));
    }
  }

  async function handleDeleteAll() {
    setError(null);
    setInfo(null);
    try {
      await deleteAll.mutateAsync({ confirmationPhrase: confirmPhrase, password });
      setConfirmPhrase("");
      setPassword("");
      setInfo(vi.settings.deleteSuccess);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  const canDeleteAll = confirmPhrase.trim() === DELETE_ALL_CONFIRMATION_PHRASE && password.length > 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.settings.deleteData}</Text>
      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>{vi.settings.deleteDataDesc}</Text>

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

      <View style={{ gap: 10 }}>
        <DeleteRow
          title={vi.settings.deleteLoansFines}
          desc={vi.settings.deleteLoansFinesDesc}
          confirmText={vi.settings.deleteLoansFinesConfirm}
          onConfirm={handleDeleteLoansFines}
          pending={deleteLoansFines.isPending}
        />
        <DeleteRow
          title={vi.settings.deletePatronsData}
          desc={vi.settings.deletePatronsDataDesc}
          confirmText={vi.settings.deletePatronsDataConfirm}
          onConfirm={handleDeletePatrons}
          pending={deletePatrons.isPending}
        />
        <DeleteRow
          title={vi.settings.deleteBooksData}
          desc={vi.settings.deleteBooksDataDesc}
          confirmText={vi.settings.deleteBooksDataConfirm}
          onConfirm={handleDeleteBooks}
          pending={deleteBooks.isPending}
        />
        <DeleteRow
          title={vi.settings.deleteCategoriesAuthorsData}
          desc={vi.settings.deleteCategoriesAuthorsDesc}
          confirmText={vi.settings.deleteCategoriesAuthorsConfirm}
          onConfirm={handleDeleteCategoriesAuthors}
          pending={deleteCategoriesAuthors.isPending}
        />
      </View>

      <View
        style={{
          marginTop: 24,
          borderWidth: 2,
          borderColor: "#fecaca",
          backgroundColor: "#fef2f2",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <Text style={{ fontWeight: "700", color: "#991b1b", marginBottom: 6 }}>{vi.settings.dangerZone}</Text>
        <Text style={{ fontSize: 12, color: "#b91c1c", marginBottom: 12 }}>{vi.settings.deleteAllDataDesc}</Text>

        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
          {vi.settings.deleteAllConfirmLabel}
        </Text>
        <TextInput
          value={confirmPhrase}
          onChangeText={setConfirmPhrase}
          autoCapitalize="characters"
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white", marginBottom: 12 }}
        />

        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
          {vi.settings.deleteAllPasswordLabel}
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white", marginBottom: 12 }}
        />

        <Pressable
          onPress={handleDeleteAll}
          disabled={!canDeleteAll || deleteAll.isPending}
          style={{
            backgroundColor: "#dc2626",
            padding: 12,
            borderRadius: 8,
            opacity: !canDeleteAll || deleteAll.isPending ? 0.5 : 1,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
            {deleteAll.isPending ? vi.common.loading : vi.settings.deleteAllButton}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
