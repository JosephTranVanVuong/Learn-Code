import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ApiError, DESTRUCTIVE_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "../../../lib/auth-context";
import { resolveAssetUrl } from "../../../lib/asset-url";
import { colors } from "../../../lib/theme";
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
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

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

export default function ChiTietChungSinhScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    email: string;
    patronTypeId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (patron && !form) {
      setForm({
        fullName: patron.fullName,
        className: patron.className ?? "",
        phone: patron.phone ?? "",
        email: patron.email ?? "",
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
    setInfo(null);
    try {
      await updatePatron.mutateAsync({
        fullName: form.fullName,
        className: form.className || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        patronTypeId: form.patronTypeId || undefined,
      });
      setInfo(`${vi.common.save} ✓`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function openPasswordModal() {
    setNewPassword("");
    setPasswordError(null);
    setShowPasswordModal(true);
  }

  async function handleResetPassword() {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    try {
      await resetPassword.mutateAsync({ password: newPassword });
      setShowPasswordModal(false);
      setInfo(`${vi.patron.resetPassword} ✓`);
    } catch (err) {
      setPasswordError(extractMessage(err, vi.common.error));
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
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textMuted }}>{vi.common.loading}</Text>
      </View>
    );
  }

  const patronType = patronTypes?.find((t) => t.id === patron.patronTypeId);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ backgroundColor: colors.navy, paddingTop: insets.top + 12, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}>
          <Ionicons name="chevron-back" size={20} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 14 }}>{vi.common.back}</Text>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#ffffff" }}>{patron.studentCode}</Text>
          {!patron.isActive && <Badge tone="neutral">{vi.patron.inactive}</Badge>}
        </View>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        {error && (
          <Text style={{ color: colors.dangerText, backgroundColor: colors.dangerBg, padding: 10, borderRadius: 8, fontSize: 13 }}>
            {error}
          </Text>
        )}
        {info && (
          <Text style={{ color: colors.successText, backgroundColor: colors.successBg, padding: 10, borderRadius: 8, fontSize: 13 }}>
            {info}
          </Text>
        )}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button variant="secondary" size="sm" icon="key-outline" onPress={openPasswordModal}>
            {vi.patron.resetPassword}
          </Button>
          {patron.isActive ? (
            canDelete && (
              <Button variant="danger" size="sm" icon="person-remove-outline" onPress={handleDeactivate}>
                {vi.patron.deactivate}
              </Button>
            )
          ) : (
            <Button
              variant="success"
              size="sm"
              icon="person-add-outline"
              onPress={handleReactivate}
              loading={updatePatron.isPending}
            >
              {vi.patron.reactivate}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              icon="trash-outline"
              onPress={handleDeletePermanently}
              loading={deletePatronPermanently.isPending}
            >
              {vi.patron.deletePermanently}
            </Button>
          )}
        </View>

        <Card style={{ alignItems: "center" }}>
          {patron.avatarUrl ? (
            <Image
              source={{ uri: resolveAssetUrl(patron.avatarUrl) ?? undefined }}
              style={{ width: 84, height: 126, borderRadius: 8, backgroundColor: colors.border }}
            />
          ) : (
            <View
              style={{
                width: 84,
                height: 126,
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#cbd5e1",
                backgroundColor: colors.background,
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: "center" }}>{vi.patron.noAvatar}</Text>
            </View>
          )}
          <Text style={{ marginTop: 10, fontWeight: "700", color: colors.textPrimary }}>{patron.fullName}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            {patron.className || vi.patron.noPatronType}
            {patronType ? ` · ${patronType.name}` : ""}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <Button variant="secondary" size="sm" icon="camera-outline" onPress={handlePickAvatar} loading={uploadAvatar.isPending}>
              {patron.avatarUrl ? vi.patron.changeAvatar : vi.patron.uploadAvatar}
            </Button>
            {patron.avatarUrl && canDelete && (
              <Button variant="danger" size="sm" icon="trash-outline" onPress={handleRemoveAvatar} loading={removeAvatar.isPending}>
                {vi.patron.removeAvatar}
              </Button>
            )}
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.patron.editPatron}</Text>

          <View>
            <FieldLabel>{vi.patron.fullName}</FieldLabel>
            <TextInput value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} style={inputStyle()} />
          </View>

          <View>
            <FieldLabel>{vi.patron.className}</FieldLabel>
            <TextInput value={form.className} onChangeText={(v) => setForm({ ...form, className: v })} style={inputStyle()} />
          </View>

          <View>
            <FieldLabel>{vi.patron.patronType}</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => setForm({ ...form, patronTypeId: "" })}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: form.patronTypeId === "" ? colors.navy : "#e2e8f0",
                  }}
                >
                  <Text style={{ color: form.patronTypeId === "" ? "#ffffff" : colors.textPrimary, fontSize: 12, fontWeight: "600" }}>
                    {vi.patron.noPatronType}
                  </Text>
                </Pressable>
                {patronTypes?.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => setForm({ ...form, patronTypeId: t.id })}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: form.patronTypeId === t.id ? colors.navy : "#e2e8f0",
                    }}
                  >
                    <Text
                      style={{
                        color: form.patronTypeId === t.id ? "#ffffff" : colors.textPrimary,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {t.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View>
            <FieldLabel>{vi.patron.phone}</FieldLabel>
            <TextInput
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              keyboardType="phone-pad"
              style={inputStyle()}
            />
          </View>

          <View>
            <FieldLabel>{vi.patron.email}</FieldLabel>
            <TextInput
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle()}
            />
          </View>

          <Button onPress={handleSave} loading={updatePatron.isPending}>
            {vi.common.save}
          </Button>
        </Card>

        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy, marginTop: 4 }}>{vi.patron.loanHistory}</Text>
        {(!loans || loans.length === 0) && (
          <Card>
            <Text style={{ color: colors.textMuted, textAlign: "center", fontSize: 13 }}>{vi.loan.noActiveLoans}</Text>
          </Card>
        )}
        {loans?.map((loan) => (
          <Card key={loan.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <Text style={{ fontWeight: "700", color: colors.textPrimary, flex: 1 }}>{loan.book.title}</Text>
              <Badge tone={loan.status === "OVERDUE" ? "danger" : loan.status === "RETURNED" ? "neutral" : "success"}>
                {vi.loanStatus[loan.status]}
              </Badge>
            </View>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              {vi.copy.barcode}: {loan.copy.barcode}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {vi.loan.dueDate}: {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
            </Text>
          </Card>
        ))}

        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy, marginTop: 8 }}>{vi.fine.title}</Text>
        {(!fines || fines.items.length === 0) && (
          <Card>
            <Text style={{ color: colors.textMuted, textAlign: "center", fontSize: 13 }}>{vi.fine.noFines}</Text>
          </Card>
        )}
        {fines?.items.map((fine) => (
          <Card key={fine.id}>
            <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
              {fine.loan.book.title} <Text style={{ fontWeight: "400", color: colors.textMuted }}>({fine.loan.copy.barcode})</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{fine.reason}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <Text style={{ fontWeight: "800", color: colors.textPrimary }}>{fine.amount.toLocaleString("vi-VN")}đ</Text>
              {fine.status === "UNPAID" ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button variant="ghost" size="sm" onPress={() => handleWaiveFine(fine.id)}>
                    {vi.fine.waive}
                  </Button>
                  <Button size="sm" icon="checkmark-circle-outline" onPress={() => handlePayFine(fine.id)}>
                    {vi.fine.pay}
                  </Button>
                </View>
              ) : (
                <Badge tone={fine.status === "PAID" ? "success" : "neutral"}>{vi.fineStatus[fine.status]}</Badge>
              )}
            </View>
          </Card>
        ))}
      </View>

      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,28,58,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "white", borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy }}>{vi.patron.resetPassword}</Text>
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.textSecondary, marginTop: 16, marginBottom: 4 }}>
              {vi.patron.password}
            </Text>
            <TextInput
              autoFocus
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={vi.patron.password}
              style={inputStyle()}
            />
            {passwordError && (
              <Text
                style={{
                  color: colors.dangerText,
                  backgroundColor: colors.dangerBg,
                  padding: 10,
                  borderRadius: 8,
                  marginTop: 12,
                  fontSize: 13,
                }}
              >
                {passwordError}
              </Text>
            )}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <Button variant="ghost" size="sm" onPress={() => setShowPasswordModal(false)}>
                {vi.common.cancel}
              </Button>
              <Button icon="key-outline" size="sm" onPress={handleResetPassword} loading={resetPassword.isPending}>
                {vi.common.save}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
