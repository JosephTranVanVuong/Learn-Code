"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { vi } from "@thuvien/shared";
import {
  useLoansByPeriod,
  useMostBorrowed,
  useOverdueSummary,
  usePatronActivity,
  useReportsOverview,
} from "@/hooks/use-reports";

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "danger" | "warning" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-600" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function BaoCaoPage() {
  const { data: overview } = useReportsOverview();
  const { data: mostBorrowed } = useMostBorrowed(10);
  const { data: overdue } = useOverdueSummary();
  const { data: loansByPeriod } = useLoansByPeriod(30);
  const { data: patronActivity } = usePatronActivity(10);

  const chartData = (mostBorrowed ?? []).map((b) => ({
    name: b.title.length > 18 ? `${b.title.slice(0, 18)}…` : b.title,
    fullTitle: b.title,
    [vi.report.borrowCount]: b.borrowCount,
  }));

  const periodData = (loansByPeriod ?? []).map((p) => ({
    date: p.date.slice(5),
    [vi.nav.loans]: p.count,
  }));

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800">{vi.report.title}</h1>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">{vi.report.mostBorrowed}</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullTitle ?? label}
                />
                <Bar dataKey={vi.report.borrowCount} fill="#0f172a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">
            {vi.report.loansByPeriod} ({vi.report.last30Days})
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey={vi.nav.loans} stroke="#0f172a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">{vi.report.overdueSummary}</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
                <tr>
                  <th className="px-4 py-2">{vi.common.stt}</th>
                  <th className="px-4 py-2">{vi.book.title}</th>
                  <th className="px-4 py-2">{vi.patron.title}</th>
                  <th className="px-4 py-2">{vi.report.daysOverdue}</th>
                  <th className="px-4 py-2">{vi.report.estimatedFine}</th>
                </tr>
              </thead>
              <tbody>
                {(!overdue || overdue.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                      {vi.report.noData}
                    </td>
                  </tr>
                )}
                {overdue?.map((item, index) => (
                  <tr key={item.loanId} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                    <td className="px-4 py-2 text-slate-800">{item.bookTitle}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {item.patronName} <span className="text-xs text-slate-400">({item.studentCode})</span>
                    </td>
                    <td className="px-4 py-2 text-red-600 font-medium">{item.daysOverdue}</td>
                    <td className="px-4 py-2 text-slate-800">{item.estimatedFine.toLocaleString("vi-VN")}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-700">{vi.report.patronActivity}</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
                <tr>
                  <th className="px-4 py-2">{vi.common.stt}</th>
                  <th className="px-4 py-2">{vi.patron.title}</th>
                  <th className="px-4 py-2">{vi.report.borrowCount}</th>
                </tr>
              </thead>
              <tbody>
                {(!patronActivity || patronActivity.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-slate-400">
                      {vi.report.noData}
                    </td>
                  </tr>
                )}
                {patronActivity?.map((item, index) => (
                  <tr key={item.patronId} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                    <td className="px-4 py-2 text-slate-800">
                      {item.fullName} <span className="text-xs text-slate-400">({item.studentCode})</span>
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800">{item.loanCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
