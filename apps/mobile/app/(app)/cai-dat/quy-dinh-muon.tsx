import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, vi } from "@thuvien/shared";
import { usePatronTypes, useUpdatePatronType } from "../../../hooks/use-patron-types";

export default function QuyDinhMuonScreen() {
  const router = useRouter();
  const { data: types, isLoading } = usePatronTypes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ maxActiveLoans: "", loanPeriodDays: "", maxRenewals: "" });
  const [error, setError] = useState<string | null>(null);

  const updateType = useUpdatePatronType(editingId ?? "__none__");

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  function startEdit(id: string, current: { maxActiveLoans: number; loanPeriodDays: number; maxRenewals: number }) {
    setEditingId(id);
    setForm({
      maxActiveLoans: String(current.maxActiveLoans),
      loanPeriodDays: String(current.loanPeriodDays),
      maxRenewals: String(current.maxRenewals),
    });
  }

  async function handleSave(id: string) {
    setError(null);
    try {
      await updateType.mutateAsync({
        maxActiveLoans: Number(form.maxActiveLoans) || 1,
        loanPeriodDays: Number(form.loanPeriodDays) || 1,
        maxRenewals: Number(form.maxRenewals) || 0,
      });
      setEditingId(null);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.settings.loanPolicy}</Text>
      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>{vi.settings.loanPolicyDesc}</Text>

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
            <Text style={{ fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>{t.name}</Text>
            {editingId === t.id ? (
              <>
                <Text style={{ fontSize: 12, color: "#64748b" }}>{vi.settings.maxActiveLoans}</Text>
                <TextInput
                  keyboardType="numeric"
                  value={form.maxActiveLoans}
                  onChangeText={(v) => setForm({ ...form, maxActiveLoans: v })}
                  style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 8, marginTop: 2, marginBottom: 8 }}
                />
                <Text style={{ fontSize: 12, color: "#64748b" }}>{vi.settings.loanPeriodDays}</Text>
                <TextInput
                  keyboardType="numeric"
                  value={form.loanPeriodDays}
                  onChangeText={(v) => setForm({ ...form, loanPeriodDays: v })}
                  style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 8, marginTop: 2, marginBottom: 8 }}
                />
                <Text style={{ fontSize: 12, color: "#64748b" }}>{vi.settings.maxRenewals}</Text>
                <TextInput
                  keyboardType="numeric"
                  value={form.maxRenewals}
                  onChangeText={(v) => setForm({ ...form, maxRenewals: v })}
                  style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 8, marginTop: 2, marginBottom: 8 }}
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable onPress={() => handleSave(t.id)}>
                    <Text style={{ color: "#047857", fontWeight: "600", fontSize: 13 }}>{vi.common.save}</Text>
                  </Pressable>
                  <Pressable onPress={() => setEditingId(null)}>
                    <Text style={{ color: "#64748b", fontSize: 13 }}>{vi.common.cancel}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 13, color: "#334155" }}>
                  {vi.settings.maxActiveLoans}: {t.maxActiveLoans} · {vi.settings.loanPeriodDays}: {t.loanPeriodDays} ·{" "}
                  {vi.settings.maxRenewals}: {t.maxRenewals}
                </Text>
                <Pressable onPress={() => startEdit(t.id, t)} style={{ marginTop: 8 }}>
                  <Text style={{ color: "#334155", fontSize: 13, fontWeight: "600" }}>{vi.common.edit}</Text>
                </Pressable>
              </>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
