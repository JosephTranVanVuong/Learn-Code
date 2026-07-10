import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, vi } from "@thuvien/shared";
import { useCategories } from "../../../hooks/use-categories";
import { useAuthors } from "../../../hooks/use-authors";
import { useCreateBook } from "../../../hooks/use-books";

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 8,
          padding: 10,
          backgroundColor: "white",
        }}
      />
    </View>
  );
}

export default function ThemSachScreen() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const { data: authors } = useAuthors();
  const createBook = useCreateBook();

  const [form, setForm] = useState({
    title: "",
    authorId: "",
    categoryId: "",
    publisher: "",
    publishedYear: "",
    isbn: "",
    classificationNumber: "",
    authorMark: "",
    initialCopies: "1",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCategoryChange(categoryId: string) {
    setForm((f) => {
      const cat = categories?.find((c) => c.id === categoryId);
      const shouldAutoFill = !f.classificationNumber && Boolean(cat?.ddcPrefix);
      return {
        ...f,
        categoryId,
        classificationNumber: shouldAutoFill ? cat!.ddcPrefix! : f.classificationNumber,
      };
    });
  }

  async function handleSubmit() {
    setError(null);
    if (!form.title || !form.authorId || !form.categoryId) {
      setError(vi.common.error);
      return;
    }
    try {
      const book = await createBook.mutateAsync({
        title: form.title,
        authorId: form.authorId,
        categoryId: form.categoryId,
        publisher: form.publisher || undefined,
        publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
        isbn: form.isbn || undefined,
        classificationNumber: form.classificationNumber || undefined,
        authorMark: form.authorMark || undefined,
        initialCopies: Number(form.initialCopies) || 0,
        location: form.location || undefined,
      });
      router.replace(`/(app)/sach/${book.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | null;
        setError(body?.message ?? vi.common.error);
      } else {
        setError(vi.common.error);
      }
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 16 }}>
          {vi.book.addNew}
        </Text>

        <Field label={vi.book.title} value={form.title} onChangeText={(v) => update("title", v)} />

        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
          {vi.book.author}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {authors?.map((author) => (
            <Pressable
              key={author.id}
              onPress={() => update("authorId", author.id)}
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
              onPress={() => handleCategoryChange(cat.id)}
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

        <Field label={vi.book.publisher} value={form.publisher} onChangeText={(v) => update("publisher", v)} />
        <Field
          label={vi.book.publishedYear}
          value={form.publishedYear}
          onChangeText={(v) => update("publishedYear", v)}
          keyboardType="numeric"
        />
        <Field label={vi.book.isbn} value={form.isbn} onChangeText={(v) => update("isbn", v)} />
        <Field
          label={vi.book.classificationNumber}
          value={form.classificationNumber}
          onChangeText={(v) => update("classificationNumber", v)}
        />
        <Field label={vi.book.authorMark} value={form.authorMark} onChangeText={(v) => update("authorMark", v)} />
        <Field
          label={vi.book.initialCopies}
          value={form.initialCopies}
          onChangeText={(v) => update("initialCopies", v)}
          keyboardType="numeric"
        />
        <Field label={vi.copy.location} value={form.location} onChangeText={(v) => update("location", v)} />

        {error && (
          <Text
            style={{
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={createBook.isPending}
          style={{
            backgroundColor: "#0f172a",
            padding: 12,
            borderRadius: 8,
            opacity: createBook.isPending ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
            {vi.common.save}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
