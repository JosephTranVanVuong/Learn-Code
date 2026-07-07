import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, vi } from "@thuvien/shared";
import { useEmailStatus, useSendTestEmail } from "../../../hooks/use-settings";

export default function EmailSettingsScreen() {
  const router = useRouter();
  const { data: status, isLoading } = useEmailStatus();
  const sendTestEmail = useSendTestEmail();

  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSendTest() {
    setError(null);
    setInfo(null);
    try {
      await sendTestEmail.mutateAsync({ to });
      setInfo(vi.settings.testEmailSent);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | null;
        setError(body?.message ?? vi.common.error);
      } else {
        setError(vi.common.error);
      }
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: 80, backgroundColor: "#f8fafc" }}>
        <Text style={{ textAlign: "center", color: "#94a3b8" }}>{vi.common.loading}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 16 }}>{vi.settings.email}</Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#e2e8f0",
            borderRadius: 10,
            padding: 14,
            backgroundColor: "white",
            marginBottom: 16,
          }}
        >
          {status?.configured ? (
            <>
              <Text
                style={{
                  color: "#047857",
                  backgroundColor: "#ecfdf5",
                  padding: 8,
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                {vi.settings.emailConfigured}
              </Text>
              <Text style={{ fontSize: 13, color: "#334155" }}>
                {vi.settings.emailHost}: {status.host}:{status.port}
              </Text>
              <Text style={{ fontSize: 13, color: "#334155", marginTop: 4 }}>
                {vi.settings.emailFrom}: {status.from}
              </Text>
            </>
          ) : (
            <Text
              style={{ color: "#b45309", backgroundColor: "#fffbeb", padding: 8, borderRadius: 8, fontSize: 13 }}
            >
              {vi.settings.emailNotConfigured}
            </Text>
          )}
        </View>

        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
          {vi.settings.testEmailTo}
        </Text>
        <TextInput
          value={to}
          onChangeText={setTo}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white", marginBottom: 16 }}
        />

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

        <Pressable
          onPress={handleSendTest}
          disabled={sendTestEmail.isPending || !status?.configured}
          style={{
            backgroundColor: "#0f172a",
            padding: 12,
            borderRadius: 8,
            opacity: sendTestEmail.isPending || !status?.configured ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>{vi.settings.sendTestEmail}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
