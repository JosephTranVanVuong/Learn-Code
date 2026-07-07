import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, DESTRUCTIVE_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "../../lib/auth-context";
import {
  useAuthors,
  useCreateAuthor,
  useDeleteAuthor,
  useUpdateAuthor,
} from "../../hooks/use-authors";

export default function TacGiaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const canDelete = user ? DESTRUCTIVE_ROLES.includes(user.role) : false;
  const { data: authors, isLoading } = useAuthors();
  const createAuthor = useCreateAuthor();
  const updateAuthor = useUpdateAuthor();
  const deleteAuthor = useDeleteAuthor();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      await createAuthor.mutateAsync({ name: newName.trim() });
      setNewName("");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleUpdate(id: string) {
    setError(null);
    try {
      await updateAuthor.mutateAsync({ id, input: { name: editingName.trim() } });
      setEditingId(null);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function handleDelete(id: string) {
    Alert.alert(vi.author.deleteConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.common.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAuthor.mutateAsync(id);
          } catch (err) {
            setError(extractMessage(err, vi.author.deleteBlocked));
          }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }}>
      <View style={{ paddingHorizontal: 20, flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ color: "#64748b" }}>&larr;</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.author.title}</Text>
      </View>

      <View style={{ paddingHorizontal: 20, flexDirection: "row", marginTop: 14, gap: 8 }}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder={vi.author.name}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#cbd5e1",
            borderRadius: 8,
            padding: 10,
            backgroundColor: "white",
          }}
        />
        <Pressable
          onPress={handleCreate}
          style={{ backgroundColor: "#0f172a", paddingHorizontal: 16, justifyContent: "center", borderRadius: 8 }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>{vi.common.add}</Text>
        </Pressable>
      </View>

      {error && (
        <Text
          style={{
            marginHorizontal: 20,
            marginTop: 10,
            color: "#b91c1c",
            backgroundColor: "#fef2f2",
            padding: 10,
            borderRadius: 8,
          }}
        >
          {error}
        </Text>
      )}

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {isLoading && <Text style={{ color: "#94a3b8" }}>{vi.common.loading}</Text>}
        {authors?.map((author, index) => (
          <View
            key={author.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
              backgroundColor: "white",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Text style={{ width: 24, color: "#94a3b8", fontSize: 12 }}>{index + 1}.</Text>
              {editingId === author.id ? (
                <TextInput
                  value={editingName}
                  onChangeText={setEditingName}
                  style={{ flex: 1, borderBottomWidth: 1, borderColor: "#cbd5e1", marginRight: 12 }}
                  autoFocus
                />
              ) : (
                <View>
                  <Text style={{ fontWeight: "500", color: "#1e293b" }}>{author.name}</Text>
                  <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                    {author.bookCount ?? 0} {vi.author.bookCount.toLowerCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 14 }}>
              {editingId === author.id ? (
                <>
                  <Pressable onPress={() => handleUpdate(author.id)}>
                    <Text style={{ color: "#0f172a", fontWeight: "600" }}>{vi.common.save}</Text>
                  </Pressable>
                  <Pressable onPress={() => setEditingId(null)}>
                    <Text style={{ color: "#94a3b8" }}>{vi.common.cancel}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      setEditingId(author.id);
                      setEditingName(author.name);
                    }}
                  >
                    <Text style={{ color: "#334155" }}>{vi.common.edit}</Text>
                  </Pressable>
                  {canDelete && (
                    <Pressable onPress={() => handleDelete(author.id)}>
                      <Text style={{ color: "#dc2626" }}>{vi.common.delete}</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
