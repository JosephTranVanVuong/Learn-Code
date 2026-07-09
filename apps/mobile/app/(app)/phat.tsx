import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { ApiError, vi, type FineStatus } from "@thuvien/shared";
import { useFines, usePayFine, useWaiveFine } from "../../hooks/use-fines";

const STATUS_FILTERS: FineStatus[] = ["UNPAID", "PAID", "WAIVED"];

export default function PhatScreen() {
  const [status, setStatus] = useState<FineStatus>("UNPAID");
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading } = useFines({ status, page: 1, pageSize: 100 });
  const payFine = usePayFine();
  const waiveFine = useWaiveFine();

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  function handlePay(id: string) {
    Alert.alert(vi.fine.payConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.fine.pay,
        onPress: async () => {
          setError(null);
          try {
            await payFine.mutateAsync(id);
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  function handleWaive(id: string) {
    Alert.alert(vi.fine.waiveConfirm, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.fine.waive,
        onPress: async () => {
          setError(null);
          try {
            await waiveFine.mutateAsync(id);
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.fine.title}</Text>

      <View style={{ flexDirection: "row", backgroundColor: "#e2e8f0", borderRadius: 8, padding: 4, marginTop: 14 }}>
        {STATUS_FILTERS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: status === s ? "white" : "transparent",
            }}
          >
            <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "500", color: "#0f172a" }}>
              {vi.fineStatus[s]}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && (
        <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12 }}>
          {error}
        </Text>
      )}

      <View style={{ marginTop: 14 }}>
        {isLoading && <Text style={{ color: "#94a3b8" }}>{vi.common.loading}</Text>}
        {!isLoading && data?.items.length === 0 && <Text style={{ color: "#94a3b8" }}>{vi.fine.noFines}</Text>}
        {data?.items.map((fine, index) => (
          <View
            key={fine.id}
            style={{
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              backgroundColor: "white",
            }}
          >
            <Text style={{ fontWeight: "600", color: "#1e293b" }}>
              <Text style={{ color: "#94a3b8" }}>{index + 1}. </Text>
              {fine.patron.fullName}
            </Text>
            <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {fine.loan.book.title} <Text style={{ color: "#94a3b8" }}>({fine.loan.copy.barcode})</Text>
            </Text>
            <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{fine.reason}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <Text style={{ fontWeight: "700", color: "#1e293b" }}>{fine.amount.toLocaleString("vi-VN")}đ</Text>
              {fine.status === "UNPAID" ? (
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <Pressable onPress={() => handleWaive(fine.id)}>
                    <Text style={{ color: "#64748b", fontSize: 13 }}>{vi.fine.waive}</Text>
                  </Pressable>
                  <Pressable onPress={() => handlePay(fine.id)}>
                    <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13 }}>{vi.fine.pay}</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: "#94a3b8" }}>{vi.fineStatus[fine.status]}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
