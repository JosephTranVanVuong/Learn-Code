import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { ApiError, DESTRUCTIVE_ROLES, vi, type NotifySendResult } from "@thuvien/shared";
import { useAuth } from "../../lib/auth-context";
import {
  useDueSoonLoans,
  useNotificationSettings,
  useOverdueForNotify,
  useSendDueSoon,
  useSendOverdue,
  useUpdateNotificationSettings,
} from "../../hooks/use-notifications";

function SendResultBanner({ result }: { result: NotifySendResult }) {
  if (!result.smtpConfigured) {
    return (
      <Text
        style={{
          marginTop: 10,
          fontSize: 12,
          color: "#b45309",
          backgroundColor: "#fffbeb",
          padding: 10,
          borderRadius: 8,
        }}
      >
        {vi.notification.smtpNotConfigured}
      </Text>
    );
  }
  return (
    <Text
      style={{
        marginTop: 10,
        fontSize: 12,
        color: "#047857",
        backgroundColor: "#ecfdf5",
        padding: 10,
        borderRadius: 8,
      }}
    >
      {result.sent}/{result.totalLoans} {vi.notification.sentCount}
      {result.skippedNoEmail > 0 ? ` · ${result.skippedNoEmail} ${vi.notification.skippedNoEmailCount}` : ""}
      {result.failed > 0 ? ` · ${result.failed} ${vi.notification.failedCount}` : ""}
    </Text>
  );
}

export default function ThongBaoScreen() {
  const { user } = useAuth();
  const canManageSettings = user ? DESTRUCTIVE_ROLES.includes(user.role) : false;
  const { data: dueSoon, isLoading: loadingDueSoon } = useDueSoonLoans();
  const { data: overdue, isLoading: loadingOverdue } = useOverdueForNotify();
  const { data: settings } = useNotificationSettings();
  const sendDueSoon = useSendDueSoon();
  const sendOverdue = useSendOverdue();
  const updateSettings = useUpdateNotificationSettings();

  const [dueSoonResult, setDueSoonResult] = useState<NotifySendResult | null>(null);
  const [overdueResult, setOverdueResult] = useState<NotifySendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleSendDueSoon() {
    setError(null);
    setDueSoonResult(null);
    try {
      const result = await sendDueSoon.mutateAsync();
      setDueSoonResult(result);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleSendOverdue() {
    setError(null);
    setOverdueResult(null);
    try {
      const result = await sendOverdue.mutateAsync();
      setOverdueResult(result);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleToggleAutoSend(checked: boolean) {
    setError(null);
    try {
      await updateSettings.mutateAsync({ autoSendEnabled: checked });
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.notification.title}</Text>

      <View
        style={{
          marginTop: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#e2e8f0",
          borderRadius: 10,
          padding: 14,
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e293b" }}>{vi.notification.autoSendToggle}</Text>
          <Text style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{vi.notification.autoSendToggleDesc}</Text>
        </View>
        <Switch
          value={settings?.autoSendEnabled ?? true}
          onValueChange={handleToggleAutoSend}
          disabled={!settings || updateSettings.isPending || !canManageSettings}
        />
      </View>

      {error && (
        <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12 }}>
          {error}
        </Text>
      )}

      <View style={{ marginTop: 16, backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14 }}>
        <Text style={{ fontWeight: "600", color: "#1e293b" }}>{vi.notification.dueSoonTitle}</Text>
        <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{vi.notification.dueSoonDesc}</Text>
        <Pressable
          onPress={handleSendDueSoon}
          disabled={sendDueSoon.isPending || !dueSoon || dueSoon.length === 0}
          style={{
            marginTop: 10,
            backgroundColor: "#0f172a",
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: "center",
            opacity: !dueSoon || dueSoon.length === 0 ? 0.5 : 1,
          }}
        >
          {sendDueSoon.isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>{vi.notification.sendNow}</Text>
          )}
        </Pressable>

        {dueSoonResult && <SendResultBanner result={dueSoonResult} />}

        <View style={{ marginTop: 12 }}>
          {loadingDueSoon && <Text style={{ color: "#94a3b8", fontSize: 12 }}>{vi.common.loading}</Text>}
          {!loadingDueSoon && dueSoon?.length === 0 && (
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>{vi.notification.noDueSoon}</Text>
          )}
          {dueSoon?.map((item, index) => (
            <View
              key={item.loanId}
              style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: "#f1f5f9", paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e293b" }}>
                <Text style={{ color: "#94a3b8" }}>{index + 1}. </Text>
                {item.bookTitle} <Text style={{ fontWeight: "400", color: "#94a3b8" }}>({item.barcode})</Text>
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
                <Text style={{ fontSize: 11, color: "#64748b" }}>
                  {item.patronName} ({item.studentCode})
                </Text>
                <Text style={{ fontSize: 11, color: item.hasEmail ? "#047857" : "#94a3b8" }}>
                  {item.hasEmail ? vi.notification.hasEmail : vi.notification.noEmail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, marginBottom: 20, backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14 }}>
        <Text style={{ fontWeight: "600", color: "#1e293b" }}>{vi.notification.overdueTitle}</Text>
        <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{vi.notification.overdueDesc}</Text>
        <Pressable
          onPress={handleSendOverdue}
          disabled={sendOverdue.isPending || !overdue || overdue.length === 0}
          style={{
            marginTop: 10,
            backgroundColor: "#0f172a",
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: "center",
            opacity: !overdue || overdue.length === 0 ? 0.5 : 1,
          }}
        >
          {sendOverdue.isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>{vi.notification.sendNow}</Text>
          )}
        </Pressable>

        {overdueResult && <SendResultBanner result={overdueResult} />}

        <View style={{ marginTop: 12 }}>
          {loadingOverdue && <Text style={{ color: "#94a3b8", fontSize: 12 }}>{vi.common.loading}</Text>}
          {!loadingOverdue && overdue?.length === 0 && (
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>{vi.notification.noOverdue}</Text>
          )}
          {overdue?.map((item, index) => (
            <View
              key={item.loanId}
              style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: "#f1f5f9", paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e293b" }}>
                <Text style={{ color: "#94a3b8" }}>{index + 1}. </Text>
                {item.bookTitle} <Text style={{ fontWeight: "400", color: "#94a3b8" }}>({item.barcode})</Text>
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
                <Text style={{ fontSize: 11, color: "#64748b" }}>
                  {item.patronName} ({item.studentCode})
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#dc2626" }}>
                  {item.daysOverdue} {vi.report.daysOverdue}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
                <Text style={{ fontSize: 11, color: "#1e293b" }}>
                  {vi.report.estimatedFine}: {item.estimatedFine.toLocaleString("vi-VN")}đ
                </Text>
                <Text style={{ fontSize: 11, color: item.hasEmail ? "#047857" : "#94a3b8" }}>
                  {item.hasEmail ? vi.notification.hasEmail : vi.notification.noEmail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
