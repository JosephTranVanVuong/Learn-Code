import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, vi } from "@thuvien/shared";
import { useFineSettings, useUpdateFineSettings } from "../../../hooks/use-settings";

export default function MucPhatScreen() {
  const router = useRouter();
  const { data: settings, isLoading } = useFineSettings();
  const updateSettings = useUpdateFineSettings();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setAmount(String(settings.finePerDayVnd));
      setInitialized(true);
    }
  }, [settings, initialized]);

  async function handleSave() {
    setError(null);
    setInfo(null);
    try {
      await updateSettings.mutateAsync({ finePerDayVnd: Number(amount) || 0 });
      setInfo(vi.settings.saved);
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 16 }}>
          {vi.settings.finePolicy}
        </Text>

        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
          {vi.settings.finePerDayVnd}
        </Text>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
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
          onPress={handleSave}
          disabled={updateSettings.isPending}
          style={{ backgroundColor: "#0f172a", padding: 12, borderRadius: 8, opacity: updateSettings.isPending ? 0.6 : 1 }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>{vi.common.save}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
