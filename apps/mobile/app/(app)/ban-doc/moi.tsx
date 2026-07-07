import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, vi } from "@thuvien/shared";
import { useCreatePatron } from "../../../hooks/use-patrons";
import { usePatronTypes } from "../../../hooks/use-patron-types";

function Field({
  label,
  value,
  onChangeText,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
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

export default function ThemChungSinhScreen() {
  const router = useRouter();
  const createPatron = useCreatePatron();
  const { data: patronTypes } = usePatronTypes();

  const [form, setForm] = useState({
    studentCode: "",
    fullName: "",
    className: "",
    phone: "",
    email: "",
    password: "",
    patronTypeId: "",
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setError(null);
    try {
      await createPatron.mutateAsync({
        studentCode: form.studentCode,
        fullName: form.fullName,
        className: form.className || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        password: form.password,
        patronTypeId: form.patronTypeId || undefined,
      });
      router.replace("/(app)/ban-doc");
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
          {vi.patron.addNew}
        </Text>

        <Field label={vi.patron.studentCode} value={form.studentCode} onChangeText={(v) => update("studentCode", v)} />
        <Field label={vi.patron.fullName} value={form.fullName} onChangeText={(v) => update("fullName", v)} />
        <Field label={vi.patron.className} value={form.className} onChangeText={(v) => update("className", v)} />

        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
            {vi.patron.patronType}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pressable
              onPress={() => update("patronTypeId", "")}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: form.patronTypeId === "" ? "#0f172a" : "#e2e8f0",
              }}
            >
              <Text style={{ color: form.patronTypeId === "" ? "white" : "#334155", fontSize: 12 }}>
                {vi.patron.noPatronType}
              </Text>
            </Pressable>
            {patronTypes?.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => update("patronTypeId", t.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: form.patronTypeId === t.id ? "#0f172a" : "#e2e8f0",
                }}
              >
                <Text style={{ color: form.patronTypeId === t.id ? "white" : "#334155", fontSize: 12 }}>
                  {t.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Field label={vi.patron.phone} value={form.phone} onChangeText={(v) => update("phone", v)} />
        <Field label={vi.patron.email} value={form.email} onChangeText={(v) => update("email", v)} />
        <Field label={vi.patron.password} value={form.password} onChangeText={(v) => update("password", v)} />

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
          disabled={createPatron.isPending}
          style={{
            backgroundColor: "#0f172a",
            padding: 12,
            borderRadius: 8,
            opacity: createPatron.isPending ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>{vi.common.save}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
