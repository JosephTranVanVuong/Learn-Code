import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { ApiError, vi } from "@thuvien/shared";
import { useAuth } from "../../lib/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/(app)/tong-quan");
    }
  }, [isLoading, user, router]);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      router.replace("/(app)/tong-quan");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | null;
        setError(body?.message ?? vi.auth.invalidCredentials);
      } else {
        setError(vi.common.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700", textAlign: "center", color: "#1e293b" }}>
        {vi.app.name}
      </Text>
      <Text style={{ textAlign: "center", color: "#64748b", marginTop: 4 }}>
        {vi.auth.loginTitle}
      </Text>
      <Text style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 2, marginBottom: 24 }}>
        {vi.auth.loginSubtitle}
      </Text>

      <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
        {vi.auth.identifier}
      </Text>
      <TextInput
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={vi.auth.identifierPlaceholder}
        style={{
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 8,
          padding: 10,
          marginBottom: 16,
          backgroundColor: "white",
        }}
      />

      <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
        {vi.auth.password}
      </Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 8,
          padding: 10,
          marginBottom: 16,
          backgroundColor: "white",
        }}
      />

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
        disabled={submitting}
        style={{
          backgroundColor: "#0f172a",
          padding: 12,
          borderRadius: 8,
          opacity: submitting ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
          {submitting ? vi.common.loading : vi.auth.loginButton}
        </Text>
      </Pressable>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 18 }}>
        {[vi.roles.QUAN_TRI, vi.roles.THU_THU, vi.roles.CONG_TAC_VIEN, vi.roles.CHUNG_SINH].map((label) => (
          <Text key={label} style={{ fontSize: 11, color: "#94a3b8" }}>
            {label}
          </Text>
        ))}
      </View>

      <Pressable onPress={() => router.push("/(public)/tra-cuu")} style={{ marginTop: 12 }}>
        <Text style={{ textAlign: "center", color: "#64748b", fontSize: 13 }}>
          {vi.publicCatalog.title}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
