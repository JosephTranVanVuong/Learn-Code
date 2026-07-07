import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, vi } from "@thuvien/shared";
import {
  useCreatePatronType,
  useDeletePatronType,
  usePatronTypes,
  useSetDefaultPatronType,
  useUpdatePatronType,
} from "../../../hooks/use-patron-types";

const DEFAULT_POLICY = { maxActiveLoans: 5, loanPeriodDays: 14, maxRenewals: 1 };

export default function LoaiDocGiaScreen() {
  const router = useRouter();
  const { data: types, isLoading } = usePatronTypes();
  const createType = useCreatePatronType();
  const setDefaultType = useSetDefaultPatronType();
  const deleteType = useDeletePatronType();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const updateType = useUpdatePatronType(editingId ?? "__none__");

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleCreate() {
    setError(null);
    if (!newName.trim()) return;
    try {
      await createType.mutateAsync({ name: newName.trim(), ...DEFAULT_POLICY });
      setNewName("");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleSaveEdit(id: string) {
    setError(null);
    try {
      await updateType.mutateAsync({ name: editingName.trim() });
      setEditingId(null);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleSetDefault(id: string) {
    setError(null);
    try {
      await setDefaultType.mutateAsync(id);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function handleDelete(id: string) {
    Alert.alert(vi.settings.deletePatronTypeConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.common.delete,
        style: "destructive",
        onPress: async () => {
          setError(null);
          try {
            await deleteType.mutateAsync(id);
          } catch (err) {
            setError(extractMessage(err, vi.settings.deletePatronTypeBlocked));
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
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.settings.patronTypes}</Text>
      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>{vi.settings.defaultTypeNote}</Text>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder={vi.settings.patronTypeName}
          style={{ flex: 1, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
        />
        <Pressable
          onPress={handleCreate}
          style={{ backgroundColor: "#0f172a", paddingHorizontal: 14, justifyContent: "center", borderRadius: 8 }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>{vi.settings.addPatronType}</Text>
        </Pressable>
      </View>

      {error && (
        <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </Text>
      )}

      {isLoading && <Text style={{ color: "#94a3b8" }}>{vi.common.loading}</Text>}

      <View style={{ gap: 8 }}>
        {types?.map((t) => (
          <View
            key={t.id}
            style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 12, backgroundColor: "white" }}
          >
            {editingId === t.id ? (
              <TextInput
                value={editingName}
                onChangeText={setEditingName}
                autoFocus
                style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 8, marginBottom: 8 }}
              />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Text style={{ fontWeight: "600", color: "#1e293b" }}>{t.name}</Text>
                {t.isDefault && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#b45309",
                      backgroundColor: "#fffbeb",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}
                  >
                    {vi.settings.isDefaultType}
                  </Text>
                )}
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              {editingId === t.id ? (
                <>
                  <Pressable onPress={() => handleSaveEdit(t.id)}>
                    <Text style={{ color: "#047857", fontWeight: "600", fontSize: 13 }}>{vi.common.save}</Text>
                  </Pressable>
                  <Pressable onPress={() => setEditingId(null)}>
                    <Text style={{ color: "#64748b", fontSize: 13 }}>{vi.common.cancel}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {!t.isDefault && (
                    <Pressable onPress={() => handleSetDefault(t.id)}>
                      <Text style={{ color: "#334155", fontSize: 13 }}>{vi.settings.setAsDefault}</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => {
                      setEditingId(t.id);
                      setEditingName(t.name);
                    }}
                  >
                    <Text style={{ color: "#334155", fontSize: 13 }}>{vi.common.edit}</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(t.id)}>
                    <Text style={{ color: "#dc2626", fontSize: 13 }}>{vi.common.delete}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
