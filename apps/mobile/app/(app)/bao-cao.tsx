import { ScrollView, Text, View } from "react-native";
import { vi } from "@thuvien/shared";
import {
  useLoansByPeriod,
  useMostBorrowed,
  useOverdueSummary,
  usePatronActivity,
  useReportsOverview,
} from "../../hooks/use-reports";

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "danger" | "warning" }) {
  return (
    <View
      style={{
        width: "48%",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <Text style={{ fontSize: 11, color: "#64748b" }}>{label}</Text>
      <Text
        style={{
          marginTop: 4,
          fontSize: 20,
          fontWeight: "700",
          color: tone === "danger" ? "#dc2626" : tone === "warning" ? "#b45309" : "#1e293b",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, color: "#334155", flex: 1 }} numberOfLines={1}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{value}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: "#e2e8f0", borderRadius: 999, marginTop: 4 }}>
        <View style={{ width: `${pct}%`, height: 6, backgroundColor: "#0f172a", borderRadius: 999 }} />
      </View>
    </View>
  );
}

export default function BaoCaoScreen() {
  const { data: overview } = useReportsOverview();
  const { data: mostBorrowed } = useMostBorrowed(8);
  const { data: overdue } = useOverdueSummary();
  const { data: patronActivity } = usePatronActivity(8);
  const { data: loansByPeriod } = useLoansByPeriod(14);

  const maxBorrow = Math.max(1, ...(mostBorrowed ?? []).map((b) => b.borrowCount));
  const maxDaily = Math.max(1, ...(loansByPeriod ?? []).map((p) => p.count));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.report.title}</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14 }}>
        <StatCard label={vi.report.totalBooks} value={String(overview?.totalBooks ?? "—")} />
        <StatCard label={vi.report.totalCopies} value={String(overview?.totalCopies ?? "—")} />
        <StatCard label={vi.report.totalPatrons} value={String(overview?.totalPatrons ?? "—")} />
        <StatCard label={vi.report.activeLoans} value={String(overview?.activeLoans ?? "—")} />
        <StatCard
          label={vi.report.overdueLoans}
          value={String(overview?.overdueLoans ?? "—")}
          tone={overview && overview.overdueLoans > 0 ? "danger" : undefined}
        />
        <StatCard
          label={vi.report.unpaidFines}
          value={overview ? `${overview.unpaidFinesTotal.toLocaleString("vi-VN")}đ` : "—"}
          tone={overview && overview.unpaidFinesCount > 0 ? "warning" : undefined}
        />
      </View>

      <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginTop: 10, marginBottom: 10 }}>
        {vi.report.mostBorrowed}
      </Text>
      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14 }}>
        {(!mostBorrowed || mostBorrowed.length === 0) && (
          <Text style={{ color: "#94a3b8" }}>{vi.report.noData}</Text>
        )}
        {mostBorrowed?.map((b) => (
          <BarRow key={b.id} label={b.title} value={b.borrowCount} max={maxBorrow} />
        ))}
      </View>

      <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginTop: 20, marginBottom: 10 }}>
        {vi.report.loansByPeriod} (14 ngày)
      </Text>
      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14 }}>
        {(!loansByPeriod || loansByPeriod.length === 0) && (
          <Text style={{ color: "#94a3b8" }}>{vi.report.noData}</Text>
        )}
        {loansByPeriod?.map((p) => (
          <BarRow key={p.date} label={p.date.slice(5)} value={p.count} max={maxDaily} />
        ))}
      </View>

      <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginTop: 20, marginBottom: 10 }}>
        {vi.report.overdueSummary}
      </Text>
      <View>
        {(!overdue || overdue.length === 0) && (
          <Text style={{ color: "#94a3b8" }}>{vi.report.noData}</Text>
        )}
        {overdue?.map((item, index) => (
          <View
            key={item.loanId}
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
              {item.bookTitle}
            </Text>
            <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {item.patronName} ({item.studentCode})
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: "#dc2626", fontWeight: "600" }}>
                {item.daysOverdue} {vi.report.daysOverdue}
              </Text>
              <Text style={{ fontSize: 12, color: "#1e293b", fontWeight: "600" }}>
                {item.estimatedFine.toLocaleString("vi-VN")}đ
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginTop: 20, marginBottom: 10 }}>
        {vi.report.patronActivity}
      </Text>
      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, marginBottom: 20 }}>
        {(!patronActivity || patronActivity.length === 0) && (
          <Text style={{ color: "#94a3b8" }}>{vi.report.noData}</Text>
        )}
        {patronActivity?.map((item, index) => (
          <View
            key={item.patronId}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 6,
              borderBottomWidth: 1,
              borderBottomColor: "#f1f5f9",
            }}
          >
            <Text style={{ fontSize: 13, color: "#334155" }}>
              <Text style={{ color: "#94a3b8" }}>{index + 1}. </Text>
              {item.fullName} ({item.studentCode})
            </Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e293b" }}>{item.loanCount}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
