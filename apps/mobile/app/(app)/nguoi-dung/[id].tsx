import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError, STAFF_ROLE_VALUES, vi } from "@thuvien/shared";
import { useAuth } from "../../../lib/auth-context";
import {
  useDeactivateUser,
  useDeleteUserPermanently,
  useResetUserPassword,
  useUpdateUser,
  useUser,
} from "../../../hooks/use-users";

type StaffRole = (typeof STAFF_ROLE_VALUES)[number];

export default function ChiTietNguoiDungScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { data: targetUser, isLoading } = useUser(id);
  const updateUser = useUpdateUser(id);
  const resetPassword = useResetUserPassword(id);
  const deactivateUser = useDeactivateUser();
  const deleteUserPermanently = useDeleteUserPermanently();

  const [form, setForm] = useState<{ fullName: string; role: StaffRole } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (targetUser && !form) {
      setForm({ fullName: targetUser.fullName, role: targetUser.role });
    }
  }, [targetUser, form]);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleSave() {
    if (!form) return;
    setError(null);
    setInfo(null);
    try {
      await updateUser.mutateAsync(form);
      setInfo(vi.common.save + " ✓");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleResetPassword() {
    setError(null);
    setInfo(null);
    try {
      await resetPassword.mutateAsync({ password: newPassword });
      setNewPassword("");
      setInfo(vi.user.resetPassword + " ✓");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function handleDeactivate() {
    Alert.alert(vi.user.deactivateConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.user.deactivate,
        style: "destructive",
        onPress: async () => {
          try {
            await deactivateUser.mutateAsync(id);
            router.replace("/(app)/nguoi-dung");
          } catch (err) {
            setError(extractMessage(err, vi.user.deactivateBlocked));
          }
        },
      },
    ]);
  }

  async function handleReactivate() {
    setError(null);
    setInfo(null);
    try {
      await updateUser.mutateAsync({ isActive: true });
      setInfo(vi.user.reactivate + " ✓");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function handleDeletePermanently() {
    Alert.alert(vi.user.deletePermanentlyConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.user.deletePermanently,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUserPermanently.mutateAsync(id);
            router.replace("/(app)/nguoi-dung");
          } catch (err) {
            setError(extractMessage(err, vi.user.deletePermanentlyBlocked));
          }
        },
      },
    ]);
  }

  if (isLoading || !form || !targetUser) {
    return (
      <View style={{ flex: 1, paddingTop: 80, backgroundColor: "#f8fafc" }}>
        <Text style={{ textAlign: "center", color: "#94a3b8" }}>{vi.common.loading}</Text>
      </View>
    );
  }

  const isSelf = currentUser?.id === targetUser.id;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
        </Pressable>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.user.editUser}</Text>
          {!isSelf && (
            <View style={{ flexDirection: "row", gap: 14 }}>
              {targetUser.isActive ? (
                <Pressable onPress={handleDeactivate}>
                  <Text style={{ color: "#dc2626", fontWeight: "600" }}>{vi.user.deactivate}</Text>
                </Pressable>
              ) : (
                <Pressable onPress={handleReactivate} disabled={updateUser.isPending}>
                  <Text style={{ color: "#047857", fontWeight: "600" }}>{vi.user.reactivate}</Text>
                </Pressable>
              )}
              <Pressable onPress={handleDeletePermanently} disabled={deleteUserPermanently.isPending}>
                <Text style={{ color: "#dc2626", fontWeight: "600" }}>{vi.user.deletePermanently}</Text>
              </Pressable>
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

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{vi.user.fullName}</Text>
          <TextInput
            value={form.fullName}
            onChangeText={(v) => setForm({ ...form, fullName: v })}
            style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
          />
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{vi.user.email}</Text>
          <Text style={{ color: "#94a3b8", padding: 10, backgroundColor: "#f1f5f9", borderRadius: 8 }}>
            {targetUser.email}
          </Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{vi.user.role}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {STAFF_ROLE_VALUES.map((role) => (
              <Pressable
                key={role}
                onPress={() => setForm({ ...form, role })}
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

        <Pressable
          onPress={handleSave}
          disabled={updateUser.isPending}
          style={{ marginTop: 18, backgroundColor: "#0f172a", padding: 12, borderRadius: 8, opacity: updateUser.isPending ? 0.6 : 1 }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>{vi.common.save}</Text>
        </Pressable>

        <View style={{ marginTop: 28, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>
            {vi.user.resetPassword}
          </Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            placeholder={vi.user.password}
            style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
          />
          <Pressable
            onPress={handleResetPassword}
            disabled={resetPassword.isPending}
            style={{
              marginTop: 10,
              borderWidth: 1,
              borderColor: "#cbd5e1",
              padding: 12,
              borderRadius: 8,
              opacity: resetPassword.isPending ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#334155", textAlign: "center", fontWeight: "600" }}>{vi.user.resetPassword}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
