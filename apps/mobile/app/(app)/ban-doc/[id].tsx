import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ApiError, DESTRUCTIVE_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "../../../lib/auth-context";
import { resolveAssetUrl } from "../../../lib/asset-url";
import {
  useDeactivatePatron,
  useDeletePatronPermanently,
  usePatron,
  usePatronLoans,
  useRemovePatronAvatar,
  useResetPatronPassword,
  useUpdatePatron,
  useUploadPatronAvatar,
} from "../../../hooks/use-patrons";
import { useFines, usePayFine, useWaiveFine } from "../../../hooks/use-fines";
import { usePatronTypes } from "../../../hooks/use-patron-types";

export default function ChiTietChungSinhScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const canDelete = user ? DESTRUCTIVE_ROLES.includes(user.role) : false;
  const { data: patron, isLoading } = usePatron(id);
  const { data: patronTypes } = usePatronTypes();
  const { data: loans } = usePatronLoans(id);
  const { data: fines } = useFines({ patronId: id, page: 1, pageSize: 50 });
  const updatePatron = useUpdatePatron(id);
  const resetPassword = useResetPatronPassword(id);
  const deactivatePatron = useDeactivatePatron();
  const deletePatronPermanently = useDeletePatronPermanently();
  const uploadAvatar = useUploadPatronAvatar(id);
  const removeAvatar = useRemovePatronAvatar(id);
  const payFine = usePayFine();
  const waiveFine = useWaiveFine();

  const [form, setForm] = useState<{
    fullName: string;
    className: string;
    phone: string;
    patronTypeId: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patron && !form) {
      setForm({
        fullName: patron.fullName,
        className: patron.className ?? "",
        phone: patron.phone ?? "",
        patronTypeId: patron.patronTypeId ?? "",
      });
    }
  }, [patron, form]);

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
    try {
      await updatePatron.mutateAsync({
        fullName: form.fullName,
        className: form.className || undefined,
        phone: form.phone || undefined,
        patronTypeId: form.patronTypeId || undefined,
      });
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleResetPassword() {
    setError(null);
    if (newPassword.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    try {
      await resetPassword.mutateAsync({ password: newPassword });
      setNewPassword("");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function handleDeactivate() {
    Alert.alert(vi.patron.deactivateConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.patron.deactivate,
        style: "destructive",
        onPress: async () => {
          try {
            await deactivatePatron.mutateAsync(id);
            router.replace("/(app)/ban-doc");
          } catch (err) {
            setError(extractMessage(err, vi.patron.deactivateBlocked));
          }
        },
      },
    ]);
  }

  function handleDeletePermanently() {
    Alert.alert(vi.patron.deletePermanentlyConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.patron.deletePermanently,
        style: "destructive",
        onPress: async () => {
          try {
            await deletePatronPermanently.mutateAsync(id);
            router.replace("/(app)/ban-doc");
          } catch (err) {
            setError(extractMessage(err, vi.patron.deletePermanentlyBlocked));
          }
        },
      },
    ]);
  }

  async function handlePickAvatar() {
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
      name: asset.fileName ?? `avatar.${ext}`,
      type,
    } as unknown as Blob);

    try {
      await uploadAvatar.mutateAsync(formData);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function handleRemoveAvatar() {
    Alert.alert(vi.patron.removeAvatarConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.patron.removeAvatar,
        style: "destructive",
        onPress: async () => {
          setError(null);
          try {
            await removeAvatar.mutateAsync();
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  function handlePayFine(fineId: string) {
    Alert.alert(vi.fine.payConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.fine.pay,
        onPress: async () => {
          setError(null);
          try {
            await payFine.mutateAsync(fineId);
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  function handleWaiveFine(fineId: string) {
    Alert.alert(vi.fine.waiveConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.fine.waive,
        style: "destructive",
        onPress: async () => {
          setError(null);
          try {
            await waiveFine.mutateAsync(fineId);
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  function handleReactivate() {
    Alert.alert(vi.patron.reactivateConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.patron.reactivate,
        onPress: async () => {
          setError(null);
          try {
            await updatePatron.mutateAsync({ isActive: true });
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  if (isLoading || !form || !patron) {
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{patron.studentCode}</Text>
          {!patron.isActive && (
            <View style={{ backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
              <Text style={{ fontSize: 11, color: "#64748b" }}>{vi.patron.inactive}</Text>
            </View>
          )}
        </View>
        {patron.isActive ? (
          canDelete && (
            <Pressable onPress={handleDeactivate}>
              <Text style={{ color: "#dc2626", fontWeight: "600" }}>{vi.patron.deactivate}</Text>
            </Pressable>
          )
        ) : (
          <Pressable onPress={handleReactivate}>
            <Text style={{ color: "#047857", fontWeight: "600" }}>{vi.patron.reactivate}</Text>
          </Pressable>
        )}
      </View>

      {canDelete && (
        <Pressable onPress={handleDeletePermanently} style={{ marginTop: 8, alignSelf: "flex-end" }}>
          <Text style={{ color: "#dc2626", fontWeight: "600", fontSize: 13 }}>{vi.patron.deletePermanently}</Text>
        </Pressable>
      )}

      {error && (
        <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12 }}>
          {error}
        </Text>
      )}

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, marginTop: 14 }}>
        {patron.avatarUrl ? (
          <Image
            source={{ uri: resolveAssetUrl(patron.avatarUrl) ?? undefined }}
            style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#e2e8f0" }}
          />
        ) : (
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#cbd5e1",
              backgroundColor: "#f8fafc",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
            }}
          >
            <Text style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>{vi.patron.noAvatar}</Text>
          </View>
        )}
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={handlePickAvatar}
            disabled={uploadAvatar.isPending}
            style={{ backgroundColor: "#0f172a", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          >
            {uploadAvatar.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                {patron.avatarUrl ? vi.patron.changeAvatar : vi.patron.uploadAvatar}
              </Text>
            )}
          </Pressable>
          {patron.avatarUrl && canDelete && (
            <Pressable
              onPress={handleRemoveAvatar}
              disabled={removeAvatar.isPending}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            >
              <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>{vi.patron.removeAvatar}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{vi.patron.fullName}</Text>
        <TextInput
          value={form.fullName}
          onChangeText={(v) => setForm({ ...form, fullName: v })}
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white", marginBottom: 12 }}
        />
        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{vi.patron.className}</Text>
        <TextInput
          value={form.className}
          onChangeText={(v) => setForm({ ...form, className: v })}
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white", marginBottom: 12 }}
        />
        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{vi.patron.patronType}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <Pressable
            onPress={() => setForm({ ...form, patronTypeId: "" })}
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
              onPress={() => setForm({ ...form, patronTypeId: t.id })}
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
        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>{vi.patron.phone}</Text>
        <TextInput
          value={form.phone}
          onChangeText={(v) => setForm({ ...form, phone: v })}
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
        />
        <Pressable
          onPress={handleSave}
          style={{ backgroundColor: "#0f172a", padding: 12, borderRadius: 8, marginTop: 14 }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>{vi.common.save}</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 20, flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
            {vi.patron.resetPassword}
          </Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
          />
        </View>
        <Pressable onPress={handleResetPassword} style={{ backgroundColor: "#0f172a", padding: 12, borderRadius: 8 }}>
          <Text style={{ color: "white", fontWeight: "600" }}>{vi.common.save}</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>
          {vi.patron.loanHistory}
        </Text>
        {(!loans || loans.length === 0) && (
          <Text style={{ color: "#94a3b8" }}>{vi.loan.noActiveLoans}</Text>
        )}
        {loans?.map((loan, index) => (
          <View
            key={loan.id}
            style={{
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              backgroundColor: "white",
            }}
          >
            <Text style={{ fontWeight: "600", color: "#1e293b" }}>
              <Text style={{ color: "#94a3b8" }}>{index + 1}. </Text>
              {loan.book.title}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                {vi.loan.dueDate}: {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color:
                    loan.status === "OVERDUE" ? "#dc2626" : loan.status === "RETURNED" ? "#64748b" : "#047857",
                }}
              >
                {vi.loanStatus[loan.status]}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 24, marginBottom: 20 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>
          {vi.fine.title}
        </Text>
        {(!fines || fines.items.length === 0) && (
          <Text style={{ color: "#94a3b8" }}>{vi.fine.noFines}</Text>
        )}
        {fines?.items.map((fine, index) => (
          <View
            key={fine.id}
            style={{
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              backgroundColor: "white",
            }}
          >
            <Text style={{ fontWeight: "600", color: "#1e293b" }}>
              <Text style={{ color: "#94a3b8" }}>{index + 1}. </Text>
              {fine.loan.book.title}
            </Text>
            <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{fine.reason}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <Text style={{ fontWeight: "700", color: "#1e293b" }}>{fine.amount.toLocaleString("vi-VN")}đ</Text>
              {fine.status === "UNPAID" ? (
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <Pressable onPress={() => handleWaiveFine(fine.id)}>
                    <Text style={{ color: "#64748b", fontSize: 13 }}>{vi.fine.waive}</Text>
                  </Pressable>
                  <Pressable onPress={() => handlePayFine(fine.id)}>
                    <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13 }}>{vi.fine.pay}</Text>
                  </Pressable>
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: fine.status === "PAID" ? "#047857" : "#64748b",
                  }}
                >
                  {vi.fineStatus[fine.status]}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
