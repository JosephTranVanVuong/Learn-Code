import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ADMIN_ROLES, ApiError, STAFF_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "../../lib/auth-context";
import { useMyLoans } from "../../hooks/use-patrons";
import { useMyFines } from "../../hooks/use-fines";
import { useChangePassword } from "../../hooks/use-change-password";

function NavButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", padding: 14, borderRadius: 10 }}
    >
      <Text style={{ fontWeight: "600", color: "#1e293b" }}>{label}</Text>
    </Pressable>
  );
}

export default function TongQuanScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;
  const isAdmin = user ? ADMIN_ROLES.includes(user.role) : false;

  const { data: myLoans } = useMyLoans();
  const { data: myFines } = useMyFines();
  const changePassword = useChangePassword();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<string | null>(null);

  function openPasswordModal() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError(null);
    setShowPasswordModal(true);
  }

  async function handleChangePassword() {
    setPasswordError(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordError(vi.auth.passwordMismatch);
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setShowPasswordModal(false);
      setPasswordInfo(vi.auth.changePasswordSuccess);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | null;
        setPasswordError(body?.message ?? vi.common.error);
      } else {
        setPasswordError(vi.common.error);
      }
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white" }} contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#1e293b" }}>{vi.nav.dashboard}</Text>
          <Text style={{ marginTop: 8, color: "#475569" }}>
            Xin chào, {user?.fullName} ({user && vi.roles[user.role]})
          </Text>
        </View>
        {!isStaff && (
          <Pressable
            onPress={openPasswordModal}
            style={{ borderWidth: 1, borderColor: "#cbd5e1", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: "#334155", fontWeight: "600", fontSize: 12 }}>{vi.auth.changePassword}</Text>
          </Pressable>
        )}
      </View>

      {passwordInfo && (
        <Text style={{ color: "#047857", backgroundColor: "#ecfdf5", padding: 10, borderRadius: 8, marginTop: 12 }}>
          {passwordInfo}
        </Text>
      )}

      <View style={{ marginTop: 24, gap: 10 }}>
        <NavButton label={vi.nav.books} onPress={() => router.push("/(app)/sach")} />
        {isStaff && (
          <>
            <NavButton label={vi.nav.categories} onPress={() => router.push("/(app)/the-loai")} />
            <NavButton label={vi.nav.authors} onPress={() => router.push("/(app)/tac-gia")} />
            <NavButton label={vi.nav.patrons} onPress={() => router.push("/(app)/ban-doc")} />
            <NavButton label={vi.nav.loans} onPress={() => router.push("/(app)/muon-tra")} />
            <NavButton label={vi.nav.fines} onPress={() => router.push("/(app)/phat")} />
            <NavButton label={vi.nav.notifications} onPress={() => router.push("/(app)/thong-bao")} />
            <NavButton label={vi.nav.reports} onPress={() => router.push("/(app)/bao-cao")} />
            {isAdmin && (
              <>
                <NavButton label={vi.nav.users} onPress={() => router.push("/(app)/nguoi-dung")} />
                <NavButton label={vi.nav.settings} onPress={() => router.push("/(app)/cai-dat")} />
              </>
            )}
          </>
        )}
      </View>

      {!isStaff && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>
            {vi.nav.loans}
          </Text>
          {(myLoans ?? []).filter((l) => l.status !== "RETURNED").length === 0 && (
            <Text style={{ color: "#94a3b8" }}>{vi.loan.noActiveLoans}</Text>
          )}
          {myLoans
            ?.filter((l) => l.status !== "RETURNED")
            .map((loan) => (
              <View
                key={loan.id}
                style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 12, marginBottom: 8 }}
              >
                <Text style={{ fontWeight: "600", color: "#1e293b" }}>{loan.book.title}</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                    {vi.loan.dueDate}: {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: loan.status === "OVERDUE" ? "#dc2626" : "#047857",
                    }}
                  >
                    {vi.loanStatus[loan.status]}
                  </Text>
                </View>
              </View>
            ))}

          <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginTop: 16, marginBottom: 8 }}>
            {vi.fine.myFines}
          </Text>
          {(myFines ?? []).filter((f) => f.status === "UNPAID").length === 0 && (
            <Text style={{ color: "#94a3b8" }}>{vi.fine.noFines}</Text>
          )}
          {myFines
            ?.filter((f) => f.status === "UNPAID")
            .map((fine) => (
              <View
                key={fine.id}
                style={{ borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", borderRadius: 10, padding: 12, marginBottom: 8 }}
              >
                <Text style={{ fontWeight: "600", color: "#991b1b" }}>{fine.loan.book.title}</Text>
                <Text style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>{fine.reason}</Text>
                <Text style={{ fontWeight: "700", color: "#991b1b", marginTop: 4 }}>
                  {fine.amount.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            ))}
        </View>
      )}

      <Pressable
        onPress={async () => {
          await logout();
          router.replace("/(auth)/dang-nhap");
        }}
        style={{ marginTop: 32, backgroundColor: "#0f172a", padding: 12, borderRadius: 8 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "500" }}>
          {vi.nav.logout}
        </Text>
      </Pressable>

      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "white", borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b" }}>{vi.auth.changePassword}</Text>

            <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 16, marginBottom: 4 }}>
              {vi.auth.currentPassword}
            </Text>
            <TextInput
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
            />

            <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 4 }}>
              {vi.auth.newPassword}
            </Text>
            <TextInput
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
            />

            <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 4 }}>
              {vi.auth.confirmNewPassword}
            </Text>
            <TextInput
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
            />

            {passwordError && (
              <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12 }}>
                {passwordError}
              </Text>
            )}

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
              <Pressable onPress={() => setShowPasswordModal(false)}>
                <Text style={{ color: "#64748b", fontWeight: "600" }}>{vi.common.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={handleChangePassword}
                disabled={changePassword.isPending}
                style={{
                  backgroundColor: "#0f172a",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  opacity: changePassword.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>{vi.common.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
