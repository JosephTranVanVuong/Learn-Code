import { useState } from "react";
import { Image, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ApiError, STAFF_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "../../lib/auth-context";
import { useMyLoans, usePatron } from "../../hooks/use-patrons";
import { useMyFines } from "../../hooks/use-fines";
import { usePatronTypes } from "../../hooks/use-patron-types";
import { useOverdueSummary, useReportsOverview } from "../../hooks/use-reports";
import { useChangePassword } from "../../hooks/use-change-password";
import { resolveAssetUrl } from "../../lib/asset-url";
import { colors } from "../../lib/theme";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

function StatTile({
  icon,
  label,
  value,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: danger ? colors.dangerBorder : colors.border,
      }}
    >
      <Ionicons name={icon} size={17} color={danger ? colors.danger : colors.navy} />
      <Text style={{ fontSize: 18, fontWeight: "800", color: danger ? colors.danger : colors.navy, marginTop: 6 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function QuickActionTile({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: colors.navy,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={colors.gold} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function TongQuanScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;

  const { data: myLoans, refetch: refetchLoans, isRefetching: refetchingLoans } = useMyLoans();
  const { data: myFines, refetch: refetchFines, isRefetching: refetchingFines } = useMyFines();
  const { data: patron, refetch: refetchPatron } = usePatron(!isStaff ? user?.id : undefined);
  const { data: patronTypes } = usePatronTypes();
  const { data: overview, refetch: refetchOverview } = useReportsOverview(isStaff);
  const { data: overdue, refetch: refetchOverdue } = useOverdueSummary(isStaff);
  const changePassword = useChangePassword();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<string | null>(null);

  const activeLoans = (myLoans ?? []).filter((l) => l.status !== "RETURNED");
  const overdueLoans = activeLoans.filter((l) => l.status === "OVERDUE");
  const unpaidFines = (myFines ?? []).filter((f) => f.status === "UNPAID");
  const totalUnpaid = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
  const patronType = patronTypes?.find((t) => t.id === patron?.patronTypeId) ?? patronTypes?.find((t) => t.isDefault);

  const sortedLoans = [...activeLoans].sort((a, b) => {
    if (a.status === "OVERDUE" && b.status !== "OVERDUE") return -1;
    if (b.status === "OVERDUE" && a.status !== "OVERDUE") return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

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

  async function handleRefresh() {
    if (isStaff) {
      await Promise.all([refetchOverview(), refetchOverdue()]);
    } else {
      await Promise.all([refetchLoans(), refetchFines(), refetchPatron()]);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refetchingLoans || refetchingFines}
          onRefresh={handleRefresh}
          tintColor={colors.navy}
        />
      }
    >
      <View style={{ backgroundColor: colors.navy, paddingTop: insets.top + 16, paddingBottom: 20, paddingHorizontal: 20 }}>
        {!isStaff ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {patron?.avatarUrl ? (
              <Image
                source={{ uri: resolveAssetUrl(patron.avatarUrl) ?? undefined }}
                style={{ width: 52, height: 78, borderRadius: 8, borderWidth: 2, borderColor: colors.gold }}
              />
            ) : (
              <View
                style={{
                  width: 52,
                  height: 78,
                  borderRadius: 8,
                  backgroundColor: colors.navyLight,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.gold,
                }}
              >
                <Text style={{ color: colors.gold, fontSize: 20, fontWeight: "700" }}>
                  {user?.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#ffffff" }}>{user?.fullName}</Text>
              <Text style={{ fontSize: 12, color: colors.gold, marginTop: 3 }}>
                {patron?.studentCode}
                {patron?.className ? ` · ${patron.className}` : ""}
                {patron?.patronTypeName ? ` · ${patron.patronTypeName}` : ""}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#ffffff" }}>{vi.nav.dashboard}</Text>
            <Text style={{ marginTop: 6, color: colors.gold, fontSize: 13 }}>
              Xin chào, {user?.fullName} ({user && vi.roles[user.role]})
            </Text>
          </>
        )}
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        {isStaff && (
          <>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatTile icon="book-outline" label={vi.report.totalBooks} value={String(overview?.totalBooks ?? "—")} />
              <StatTile
                icon="layers-outline"
                label={vi.report.totalCopies}
                value={String(overview?.totalCopies ?? "—")}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatTile
                icon="people-outline"
                label={vi.report.totalPatrons}
                value={String(overview?.totalPatrons ?? "—")}
              />
              <StatTile
                icon="swap-horizontal-outline"
                label={vi.report.activeLoans}
                value={String(overview?.activeLoans ?? "—")}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatTile
                icon="alert-circle-outline"
                label={vi.report.overdueLoans}
                value={String(overview?.overdueLoans ?? "—")}
                danger={Boolean(overview && overview.overdueLoans > 0)}
              />
              <StatTile
                icon="cash-outline"
                label={vi.report.unpaidFines}
                value={overview ? `${overview.unpaidFinesTotal.toLocaleString("vi-VN")}đ` : "—"}
                danger={Boolean(overview && overview.unpaidFinesCount > 0)}
              />
            </View>

            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy, marginTop: 4 }}>Thao tác nhanh</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <QuickActionTile
                icon="book-outline"
                label={vi.book.addNew}
                onPress={() => router.push("/(app)/sach/moi")}
              />
              <QuickActionTile
                icon="person-add-outline"
                label={vi.patron.addNew}
                onPress={() => router.push("/(app)/ban-doc/moi")}
              />
            </View>

            {overdue && overdue.length > 0 && (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.report.overdueSummary}</Text>
                  <Pressable onPress={() => router.push("/(app)/bao-cao")}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.navy }}>Xem tất cả →</Text>
                  </Pressable>
                </View>
                {overdue.slice(0, 5).map((item) => (
                  <Card key={item.loanId}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <Text style={{ fontWeight: "700", color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                        {item.bookTitle}
                      </Text>
                      <Badge tone="danger">
                        {item.daysOverdue} {vi.report.daysOverdue}
                      </Badge>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                      {item.patronName} ({item.studentCode})
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.dangerText, marginTop: 2, fontWeight: "600" }}>
                      {vi.report.estimatedFine}: {item.estimatedFine.toLocaleString("vi-VN")}đ
                    </Text>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        {!isStaff && overdueLoans.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: colors.dangerBg,
              borderWidth: 1,
              borderColor: colors.dangerBorder,
              borderRadius: 10,
              padding: 12,
            }}
          >
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: colors.dangerText }}>
              Bạn có {overdueLoans.length} sách quá hạn — vui lòng trả sớm để tránh phí phạt tăng thêm
            </Text>
          </View>
        )}

        {!isStaff && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatTile
              icon="book-outline"
              label="Đang mượn"
              value={patronType ? `${activeLoans.length}/${patronType.maxActiveLoans}` : String(activeLoans.length)}
            />
            <StatTile
              icon="alert-circle-outline"
              label="Quá hạn"
              value={String(overdueLoans.length)}
              danger={overdueLoans.length > 0}
            />
            <StatTile
              icon="cash-outline"
              label="Phạt chưa trả"
              value={totalUnpaid > 0 ? `${totalUnpaid.toLocaleString("vi-VN")}đ` : "0đ"}
              danger={totalUnpaid > 0}
            />
          </View>
        )}

        {passwordInfo && (
          <Text
            style={{
              color: colors.successText,
              backgroundColor: colors.successBg,
              padding: 10,
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            {passwordInfo}
          </Text>
        )}

        {!isStaff && (
          <>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy, marginTop: 4 }}>{vi.nav.loans}</Text>
            {sortedLoans.length === 0 ? (
              <Card>
                <Text style={{ color: colors.textMuted, textAlign: "center", fontSize: 13 }}>
                  {vi.loan.noActiveLoans}
                </Text>
              </Card>
            ) : (
              sortedLoans.map((loan) => (
                <Card key={loan.id}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <Text style={{ fontWeight: "700", color: colors.textPrimary, flex: 1 }}>{loan.book.title}</Text>
                    <Badge tone={loan.status === "OVERDUE" ? "danger" : "success"}>{vi.loanStatus[loan.status]}</Badge>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                    {vi.copy.barcode}: {loan.copy.barcode}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {vi.loan.dueDate}: {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                  </Text>
                </Card>
              ))
            )}

            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy, marginTop: 8 }}>{vi.fine.myFines}</Text>
            {unpaidFines.length === 0 ? (
              <Card>
                <Text style={{ color: colors.textMuted, textAlign: "center", fontSize: 13 }}>{vi.fine.noFines}</Text>
              </Card>
            ) : (
              unpaidFines.map((fine) => (
                <Card key={fine.id} style={{ backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }}>
                  <Text style={{ fontWeight: "700", color: colors.dangerText }}>
                    {fine.loan.book.title} <Text style={{ fontWeight: "400" }}>({fine.loan.copy.barcode})</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.dangerText, marginTop: 2 }}>{fine.reason}</Text>
                  <Text style={{ fontWeight: "800", color: colors.dangerText, marginTop: 4 }}>
                    {fine.amount.toLocaleString("vi-VN")}đ
                  </Text>
                </Card>
              ))
            )}

            <Button variant="secondary" icon="key-outline" onPress={openPasswordModal}>
              {vi.auth.changePassword}
            </Button>
          </>
        )}

        <Button
          variant="danger"
          icon="log-out-outline"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/dang-nhap");
          }}
        >
          {vi.nav.logout}
        </Button>
      </View>

      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,28,58,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "white", borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy }}>{vi.auth.changePassword}</Text>

            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.textSecondary, marginTop: 16, marginBottom: 4 }}>
              {vi.auth.currentPassword}
            </Text>
            <TextInput
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
            />

            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.textSecondary, marginTop: 12, marginBottom: 4 }}>
              {vi.auth.newPassword}
            </Text>
            <TextInput
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
            />

            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.textSecondary, marginTop: 12, marginBottom: 4 }}>
              {vi.auth.confirmNewPassword}
            </Text>
            <TextInput
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
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
              <Button size="sm" onPress={handleChangePassword} loading={changePassword.isPending}>
                {vi.common.save}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
