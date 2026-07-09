import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ApiError, DESTRUCTIVE_ROLES, STAFF_ROLES, vi, type CopyStatus } from "@thuvien/shared";
import { useAuth } from "../../../lib/auth-context";
import { resolveAssetUrl } from "../../../lib/asset-url";
import {
  useBook,
  useDeleteBook,
  useRemoveBookCover,
  useUpdateBook,
  useUpdateBookCopiesLocation,
  useUploadBookCover,
} from "../../../hooks/use-books";
import { useAuthors } from "../../../hooks/use-authors";
import { useCategories } from "../../../hooks/use-categories";
import { useAddCopies, useDeleteCopy, useUpdateCopy } from "../../../hooks/use-copies";

const COPY_STATUS_OPTIONS: CopyStatus[] = ["AVAILABLE", "BORROWED", "LOST", "DAMAGED", "WITHDRAWN"];

function commonCopyLocation(copies: { location: string | null }[]): string {
  if (copies.length === 0) return "";
  const first = copies[0].location ?? "";
  return copies.every((c) => (c.location ?? "") === first) ? first : "";
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 8,
          padding: 10,
          backgroundColor: "white",
          textAlignVertical: multiline ? "top" : "center",
          minHeight: multiline ? 80 : undefined,
        }}
      />
    </View>
  );
}

export default function SachDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;
  const canDelete = user ? DESTRUCTIVE_ROLES.includes(user.role) : false;
  const { data: book, isLoading } = useBook(id);
  const { data: authors } = useAuthors();
  const { data: categories } = useCategories();
  const deleteBook = useDeleteBook();
  const updateBook = useUpdateBook(id);
  const updateCopiesLocation = useUpdateBookCopiesLocation(id);
  const addCopies = useAddCopies(id);
  const updateCopy = useUpdateCopy(id);
  const deleteCopy = useDeleteCopy(id);
  const uploadCover = useUploadBookCover(id);
  const removeCover = useRemoveBookCover(id);

  const [newCopyQty, setNewCopyQty] = useState("1");
  const [newCopyLocation, setNewCopyLocation] = useState("");
  const locationDrafts = useRef<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [bulkLocation, setBulkLocation] = useState<string | null>(null);
  const [initialBulkLocation, setInitialBulkLocation] = useState("");

  const [form, setForm] = useState<{
    title: string;
    authorId: string;
    categoryId: string;
    publisher: string;
    publishedYear: string;
    isbn: string;
    language: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (book && bulkLocation === null) {
      const loc = commonCopyLocation(book.copies);
      setBulkLocation(loc);
      setInitialBulkLocation(loc);
    }
  }, [book, bulkLocation]);

  useEffect(() => {
    if (book && !form) {
      setForm({
        title: book.title,
        authorId: book.authorId,
        categoryId: book.categoryId,
        publisher: book.publisher ?? "",
        publishedYear: book.publishedYear ? String(book.publishedYear) : "",
        isbn: book.isbn ?? "",
        language: book.language ?? "",
        description: book.description ?? "",
      });
    }
  }, [book, form]);

  function updateForm<K extends keyof NonNullable<typeof form>>(key: K, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSaveBookInfo() {
    if (!form) return;
    setError(null);
    setInfo(null);
    try {
      await updateBook.mutateAsync({
        title: form.title,
        authorId: form.authorId,
        categoryId: form.categoryId,
        publisher: form.publisher || undefined,
        publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
        isbn: form.isbn || undefined,
        language: form.language || undefined,
        description: form.description || undefined,
      });
      setInfo(`${vi.common.save} ✓`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleDeleteBook() {
    Alert.alert(vi.book.deleteConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.common.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBook.mutateAsync(id);
            router.replace("/(app)/sach");
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  async function handlePickCover() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Cần cấp quyền truy cập thư viện ảnh");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const type = asset.mimeType ?? (ext === "png" ? "image/png" : "image/jpeg");
    const formData = new FormData();
    formData.append("file", {
      uri: asset.uri,
      name: asset.fileName ?? `cover.${ext}`,
      type,
    } as unknown as Blob);

    try {
      await uploadCover.mutateAsync(formData);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function handleRemoveCover() {
    Alert.alert(vi.book.removeCoverConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.book.removeCover,
        style: "destructive",
        onPress: async () => {
          setError(null);
          try {
            await removeCover.mutateAsync();
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  async function handleAddCopies() {
    setError(null);
    try {
      await addCopies.mutateAsync({ quantity: Number(newCopyQty) || 1, location: newCopyLocation || undefined });
      setNewCopyQty("1");
      setNewCopyLocation("");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function cycleStatus(copyId: string, current: CopyStatus) {
    const idx = COPY_STATUS_OPTIONS.indexOf(current);
    const next = COPY_STATUS_OPTIONS[(idx + 1) % COPY_STATUS_OPTIONS.length];
    try {
      await updateCopy.mutateAsync({ id: copyId, input: { status: next } });
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleSaveBulkLocation() {
    if (bulkLocation === null) return;
    setError(null);
    try {
      await updateCopiesLocation.mutateAsync({ location: bulkLocation });
      setInitialBulkLocation(bulkLocation);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleCopyLocationChange(copyId: string, location: string) {
    setError(null);
    try {
      await updateCopy.mutateAsync({ id: copyId, input: { location } });
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeleteCopy(copyId: string) {
    Alert.alert(vi.copy.deleteConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.common.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCopy.mutateAsync(copyId);
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  if (isLoading || !book || !form) {
    return (
      <View style={{ flex: 1, paddingTop: 80, backgroundColor: "#f8fafc" }}>
        <Text style={{ textAlign: "center", color: "#94a3b8" }}>{vi.common.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
      </Pressable>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{book.title}</Text>
          <Text style={{ color: "#64748b", marginTop: 2 }}>{book.author.name}</Text>
          <Text style={{ color: "#94a3b8", marginTop: 4, fontSize: 12 }}>{book.category.name}</Text>
        </View>
        {canDelete && (
          <Pressable onPress={handleDeleteBook}>
            <Text style={{ color: "#dc2626", fontWeight: "600" }}>{vi.common.delete}</Text>
          </Pressable>
        )}
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, marginTop: 14 }}>
        {book.coverImageUrl ? (
          <Image
            source={{ uri: resolveAssetUrl(book.coverImageUrl) ?? undefined }}
            style={{ width: 100, height: 150, borderRadius: 8, backgroundColor: "#e2e8f0" }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 100,
              height: 150,
              borderRadius: 8,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#cbd5e1",
              backgroundColor: "#f8fafc",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
            }}
          >
            <Text style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>{vi.book.noCover}</Text>
          </View>
        )}
        {isStaff && (
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={handlePickCover}
              disabled={uploadCover.isPending}
              style={{ backgroundColor: "#0f172a", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            >
              {uploadCover.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                  {book.coverImageUrl ? vi.book.changeCover : vi.book.uploadCover}
                </Text>
              )}
            </Pressable>
            {book.coverImageUrl && canDelete && (
              <Pressable
                onPress={handleRemoveCover}
                disabled={removeCover.isPending}
                style={{ borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>{vi.book.removeCover}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {error && (
        <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12 }}>
          {error}
        </Text>
      )}
      {info && (
        <Text style={{ color: "#047857", backgroundColor: "#ecfdf5", padding: 10, borderRadius: 8, marginTop: 12 }}>
          {info}
        </Text>
      )}

      {isStaff ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 10 }}>
            {vi.book.editBook}
          </Text>

          <Field label={vi.book.title} value={form.title} onChangeText={(v) => updateForm("title", v)} />

          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{vi.book.author}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {authors?.map((author) => (
              <Pressable
                key={author.id}
                onPress={() => updateForm("authorId", author.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  marginRight: 8,
                  backgroundColor: form.authorId === author.id ? "#0f172a" : "#e2e8f0",
                }}
              >
                <Text style={{ color: form.authorId === author.id ? "white" : "#334155", fontSize: 12 }}>
                  {author.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
            {vi.book.category}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {categories?.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => updateForm("categoryId", cat.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  marginRight: 8,
                  backgroundColor: form.categoryId === cat.id ? "#0f172a" : "#e2e8f0",
                }}
              >
                <Text style={{ color: form.categoryId === cat.id ? "white" : "#334155", fontSize: 12 }}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Field label={vi.book.publisher} value={form.publisher} onChangeText={(v) => updateForm("publisher", v)} />
          <Field
            label={vi.book.publishedYear}
            value={form.publishedYear}
            onChangeText={(v) => updateForm("publishedYear", v)}
            keyboardType="numeric"
          />
          <Field label={vi.book.isbn} value={form.isbn} onChangeText={(v) => updateForm("isbn", v)} />
          <Field label={vi.book.language} value={form.language} onChangeText={(v) => updateForm("language", v)} />
          <Field
            label={vi.book.description}
            value={form.description}
            onChangeText={(v) => updateForm("description", v)}
            multiline
          />

          <Pressable
            onPress={handleSaveBookInfo}
            disabled={updateBook.isPending}
            style={{
              backgroundColor: "#0f172a",
              padding: 12,
              borderRadius: 8,
              opacity: updateBook.isPending ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>{vi.common.save}</Text>
          </Pressable>
        </View>
      ) : (
        book.description && <Text style={{ color: "#475569", marginTop: 12 }}>{book.description}</Text>
      )}

      {isStaff && book.copies.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
            {vi.copy.location}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              value={bulkLocation ?? ""}
              onChangeText={setBulkLocation}
              placeholder={
                book.copies.length > 1 ? vi.book.locationAppliesToAll : vi.copy.location
              }
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 8,
                padding: 8,
                backgroundColor: "white",
                fontSize: 12,
              }}
            />
            <Pressable
              onPress={handleSaveBulkLocation}
              disabled={updateCopiesLocation.isPending || bulkLocation === initialBulkLocation}
              style={{
                backgroundColor: "#0f172a",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                opacity: bulkLocation === initialBulkLocation ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{vi.common.save}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={{ marginTop: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b" }}>
          {vi.copy.title} ({book.availableCopies}/{book.totalCopies} {vi.book.availability})
        </Text>
      </View>

      {isStaff && (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 }}>
          <TextInput
            value={newCopyQty}
            onChangeText={setNewCopyQty}
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 8,
              padding: 8,
              width: 60,
              backgroundColor: "white",
            }}
          />
          <TextInput
            value={newCopyLocation}
            onChangeText={setNewCopyLocation}
            placeholder={vi.copy.location}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 8,
              padding: 8,
              backgroundColor: "white",
            }}
          />
          <Pressable
            onPress={handleAddCopies}
            style={{ backgroundColor: "#0f172a", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{vi.copy.addCopies}</Text>
          </Pressable>
        </View>
      )}

      <View style={{ marginTop: 14 }}>
        {book.copies.map((copy) => (
          <View
            key={copy.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              backgroundColor: "white",
            }}
          >
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontFamily: "monospace", fontSize: 12, color: "#475569" }}>{copy.barcode}</Text>
              {isStaff ? (
                <TextInput
                  key={copy.id}
                  defaultValue={copy.location ?? ""}
                  onChangeText={(text) => {
                    locationDrafts.current[copy.id] = text;
                  }}
                  onBlur={() => {
                    const draft = locationDrafts.current[copy.id];
                    if (draft !== undefined && draft !== (copy.location ?? "")) {
                      handleCopyLocationChange(copy.id, draft);
                    }
                  }}
                  placeholder={vi.copy.location}
                  style={{
                    fontSize: 11,
                    color: "#334155",
                    borderBottomWidth: 1,
                    borderBottomColor: "#e2e8f0",
                    marginTop: 2,
                    paddingVertical: 2,
                  }}
                />
              ) : copy.location ? (
                <Text style={{ fontSize: 11, color: "#94a3b8" }}>{copy.location}</Text>
              ) : null}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {isStaff ? (
                <>
                  <Pressable
                    onPress={() => cycleStatus(copy.id, copy.status)}
                    style={{ backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}
                  >
                    <Text style={{ fontSize: 11, color: "#334155" }}>{vi.copyStatus[copy.status]}</Text>
                  </Pressable>
                  {canDelete && (
                    <Pressable onPress={() => handleDeleteCopy(copy.id)}>
                      <Text style={{ color: "#dc2626", fontSize: 12 }}>{vi.common.delete}</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <View style={{ backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                  <Text style={{ fontSize: 11, color: "#334155" }}>{vi.copyStatus[copy.status]}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
