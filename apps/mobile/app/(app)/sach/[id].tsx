import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ApiError, DESTRUCTIVE_ROLES, STAFF_ROLES, vi, type CopyStatus } from "@thuvien/shared";
import { useAuth } from "../../../lib/auth-context";
import { resolveAssetUrl } from "../../../lib/asset-url";
import { colors } from "../../../lib/theme";
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
import { Card } from "../../../components/ui/Card";
import { Badge, type BadgeTone } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

const COPY_STATUS_OPTIONS: CopyStatus[] = ["AVAILABLE", "BORROWED", "LOST", "DAMAGED", "WITHDRAWN"];

const COPY_STATUS_TONE: Record<CopyStatus, BadgeTone> = {
  AVAILABLE: "success",
  BORROWED: "gold",
  LOST: "danger",
  DAMAGED: "danger",
  WITHDRAWN: "neutral",
};

function commonCopyLocation(copies: { location: string | null }[]): string {
  if (copies.length === 0) return "";
  const first = copies[0].location ?? "";
  return copies.every((c) => (c.location ?? "") === first) ? first : "";
}

function inputStyle(extra?: object) {
  return {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#ffffff",
    fontSize: 14,
    ...extra,
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 }}>{children}</Text>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: "500" }}>{value}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
  editable = true,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  editable?: boolean;
  hint?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        style={inputStyle({
          textAlignVertical: multiline ? "top" : "center",
          minHeight: multiline ? 90 : undefined,
          backgroundColor: editable ? "#ffffff" : "#f8fafc",
          color: editable ? colors.textPrimary : colors.textMuted,
        })}
      />
      {hint && <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{hint}</Text>}
    </View>
  );
}

function ChipPicker<T extends { id: string; name: string }>({
  items,
  selectedId,
  onSelect,
}: {
  items: T[] | undefined;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {items?.map((item) => {
          const selected = selectedId === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: selected ? colors.navy : "#f1f5f9",
              }}
            >
              <Text style={{ color: selected ? "#ffffff" : colors.textSecondary, fontSize: 12, fontWeight: "600" }}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function SachDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    classificationNumber: string;
    authorMark: string;
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
        classificationNumber: book.classificationNumber ?? "",
        authorMark: book.authorMark ?? "",
      });
    }
  }, [book, form]);

  function updateForm<K extends keyof NonNullable<typeof form>>(key: K, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function handleCategoryChange(categoryId: string) {
    setForm((f) => {
      if (!f) return f;
      const cat = categories?.find((c) => c.id === categoryId);
      return {
        ...f,
        categoryId,
        classificationNumber: cat?.ddcPrefix ?? "",
      };
    });
  }

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
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
        classificationNumber: form.classificationNumber || undefined,
        authorMark: form.authorMark || undefined,
      });
      setInfo(`${vi.common.save} ✓`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function handleDeleteBook() {
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

  function handleDeleteCopy(copyId: string) {
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
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textMuted }}>{vi.common.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ backgroundColor: colors.navy, paddingTop: insets.top + 12, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}
        >
          <Ionicons name="chevron-back" size={20} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 14 }}>{vi.common.back}</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#ffffff" }} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={{ fontSize: 13, color: "#c7d2e8", marginTop: 2 }}>{book.author.name}</Text>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        {error && (
          <Text
            style={{ color: colors.dangerText, backgroundColor: colors.dangerBg, padding: 10, borderRadius: 8, fontSize: 13 }}
          >
            {error}
          </Text>
        )}
        {info && (
          <Text
            style={{ color: colors.successText, backgroundColor: colors.successBg, padding: 10, borderRadius: 8, fontSize: 13 }}
          >
            {info}
          </Text>
        )}

        {canDelete && (
          <View style={{ flexDirection: "row" }}>
            <Button variant="danger" size="sm" icon="trash-outline" onPress={handleDeleteBook} loading={deleteBook.isPending}>
              {vi.common.delete}
            </Button>
          </View>
        )}

        <Card style={{ alignItems: "center" }}>
          {book.coverImageUrl ? (
            <Image
              source={{ uri: resolveAssetUrl(book.coverImageUrl) ?? undefined }}
              style={{ width: 110, height: 165, borderRadius: 8, backgroundColor: colors.border }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 110,
                height: 165,
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#cbd5e1",
                backgroundColor: colors.background,
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
              }}
            >
              <Ionicons name="image-outline" size={22} color={colors.textMuted} />
              <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 6 }}>
                {vi.book.noCover}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 10, textAlign: "center" }}>
            {book.category.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            {book.availableCopies}/{book.totalCopies} {vi.book.availability}
          </Text>
          {isStaff && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <Button
                variant="secondary"
                size="sm"
                icon="camera-outline"
                onPress={handlePickCover}
                loading={uploadCover.isPending}
              >
                {book.coverImageUrl ? vi.book.changeCover : vi.book.uploadCover}
              </Button>
              {book.coverImageUrl && canDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  icon="trash-outline"
                  onPress={handleRemoveCover}
                  loading={removeCover.isPending}
                >
                  {vi.book.removeCover}
                </Button>
              )}
            </View>
          )}
        </Card>

        {isStaff ? (
          <Card style={{ gap: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.book.sectionBasicInfo}</Text>
            <View style={{ marginTop: 8 }}>
              <Field label={vi.book.title} value={form.title} onChangeText={(v) => updateForm("title", v)} />
              <FieldLabel>{vi.book.author}</FieldLabel>
              <ChipPicker items={authors} selectedId={form.authorId} onSelect={(v) => updateForm("authorId", v)} />
              <FieldLabel>{vi.book.category}</FieldLabel>
              <ChipPicker items={categories} selectedId={form.categoryId} onSelect={handleCategoryChange} />
              <Field
                label={vi.book.classificationNumber}
                value={form.classificationNumber}
                onChangeText={(v) => updateForm("classificationNumber", v)}
                editable={false}
                hint={vi.book.classificationNumberHint}
              />
              <Field
                label={vi.book.authorMark}
                value={form.authorMark}
                onChangeText={(v) => updateForm("authorMark", v)}
              />
            </View>
          </Card>
        ) : null}

        {isStaff ? (
          <Card style={{ gap: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.book.sectionPublicationInfo}</Text>
            <View style={{ marginTop: 8 }}>
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
            </View>
            <Button onPress={handleSaveBookInfo} loading={updateBook.isPending}>
              {vi.common.save}
            </Button>
          </Card>
        ) : (
          <Card style={{ gap: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.book.sectionPublicationInfo}</Text>
            {book.publisher && <InfoRow label={vi.book.publisher} value={book.publisher} />}
            {book.publishedYear && <InfoRow label={vi.book.publishedYear} value={String(book.publishedYear)} />}
            {book.isbn && <InfoRow label={vi.book.isbn} value={book.isbn} />}
            {book.language && <InfoRow label={vi.book.language} value={book.language} />}
            {commonCopyLocation(book.copies) && <InfoRow label={vi.copy.location} value={commonCopyLocation(book.copies)} />}
            {(book.classificationNumber || book.authorMark) && (
              <InfoRow
                label={vi.book.callNumber}
                value={[book.classificationNumber, book.authorMark].filter(Boolean).join(" ")}
              />
            )}
            {!book.publisher && !book.publishedYear && !book.isbn && !book.language && !commonCopyLocation(book.copies) && (
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{vi.common.noData}</Text>
            )}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.book.description}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                {book.description || vi.book.noDescription}
              </Text>
            </View>
          </Card>
        )}

        {isStaff && book.copies.length > 0 && (
          <Card style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.book.sectionCopiesLocation}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                value={bulkLocation ?? ""}
                onChangeText={setBulkLocation}
                placeholder={book.copies.length > 1 ? vi.book.locationAppliesToAll : vi.copy.location}
                style={inputStyle({ flex: 1, fontSize: 12 })}
              />
              <Button
                size="sm"
                onPress={handleSaveBulkLocation}
                disabled={bulkLocation === initialBulkLocation}
                loading={updateCopiesLocation.isPending}
              >
                {vi.common.save}
              </Button>
            </View>
          </Card>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy }}>
            {vi.copy.title} ({book.availableCopies}/{book.totalCopies})
          </Text>
        </View>

        {isStaff && (
          <Card style={{ gap: 8 }}>
            <FieldLabel>{vi.copy.addCopies}</FieldLabel>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                value={newCopyQty}
                onChangeText={setNewCopyQty}
                keyboardType="numeric"
                style={inputStyle({ width: 56, textAlign: "center" })}
              />
              <TextInput
                value={newCopyLocation}
                onChangeText={setNewCopyLocation}
                placeholder={vi.copy.location}
                style={inputStyle({ flex: 1 })}
              />
              <Button size="sm" icon="add-outline" onPress={handleAddCopies} loading={addCopies.isPending}>
                {vi.copy.addCopies}
              </Button>
            </View>
          </Card>
        )}

        <View style={{ gap: 8 }}>
          {book.copies.map((copy) => (
            <Card key={copy.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontFamily: "monospace", fontSize: 13, fontWeight: "600", color: colors.textPrimary }}>
                  {copy.barcode}
                </Text>
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
                      fontSize: 12,
                      color: colors.textSecondary,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      marginTop: 4,
                      paddingVertical: 2,
                    }}
                  />
                ) : copy.location ? (
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{copy.location}</Text>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {isStaff ? (
                  <>
                    <Pressable onPress={() => cycleStatus(copy.id, copy.status)}>
                      <Badge tone={COPY_STATUS_TONE[copy.status]}>{vi.copyStatus[copy.status]}</Badge>
                    </Pressable>
                    {canDelete && (
                      <Pressable onPress={() => handleDeleteCopy(copy.id)}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </Pressable>
                    )}
                  </>
                ) : (
                  <Badge tone={COPY_STATUS_TONE[copy.status]}>{vi.copyStatus[copy.status]}</Badge>
                )}
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
