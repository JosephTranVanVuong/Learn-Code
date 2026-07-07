import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, STAFF_ROLE_VALUES, vi } from "@thuvien/shared";
import { useCreateUser } from "../../../hooks/use-users";

type StaffRole = (typeof STAFF_ROLE_VALUES)[number];

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
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

export default function ThemNguoiDungScreen() {
  const router = useRouter();
  const createUser = useCreateUser();

  const [form, setForm] = useState<{ fullName: string; email: string; password: string; role: StaffRole }>({
    fullName: "",
    email: "",
    password: "",
    role: "THU_THU",
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setError(null);
    try {
      await createUser.mutateAsync(form);
      router.replace("/(app)/nguoi-dung");
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
          {vi.user.addNew}
        </Text>

        <Field label={vi.user.fullName} value={form.fullName} onChangeText={(v) => update("fullName", v)} />
        <Field label={vi.user.email} value={form.email} onChangeText={(v) => update("email", v)} />
        <Field label={vi.user.password} value={form.password} onChangeText={(v) => update("password", v)} />

        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{vi.user.role}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {STAFF_ROLE_VALUES.map((role) => (
              <Pressable
                key={role}
                onPress={() => update("role", role)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: form.role === role ? "#0f172a" : "#e2e8f0",
                }}
              >
                <Text style={{ color: form.role === role ? "white" : "#334155", fontSize: 12 }}>
                  {vi.roles[role]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

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
          disabled={createUser.isPending}
          style={{
            backgroundColor: "#0f172a",
            padding: 12,
            borderRadius: 8,
            opacity: createUser.isPending ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>{vi.common.save}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
