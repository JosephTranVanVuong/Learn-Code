"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  CircleDollarSign,
  KeyRound,
  Layers,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ApiError, STAFF_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "@/lib/auth-context";
import { useMyLoans } from "@/hooks/use-patrons";
import { useMyFines } from "@/hooks/use-fines";
import { useOverdueSummary, useReportsOverview } from "@/hooks/use-reports";
import { useChangePassword } from "@/hooks/use-change-password";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "danger" | "warning";
}) {
  const toneClass = {
    default: { badge: "bg-[#0f1c3a]/[0.06] text-[#0f1c3a]", value: "text-[#0f1c3a]" },
    danger: { badge: "bg-red-50 text-red-600", value: "text-red-600" },
    warning: { badge: "bg-amber-50 text-amber-600", value: "text-amber-600" },
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass.badge}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{label}</p>
        <p className={`mt-0.5 text-xl font-semibold ${toneClass.value}`}>{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#c9a24b] hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f1c3a] text-[#c9a24b]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <span className="text-sm font-medium text-slate-700 group-hover:text-[#0f1c3a]">{label}</span>
    </Link>
  );
}

export default function TongQuanPage() {
  const { user } = useAuth();
  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;
  const { data: myLoans } = useMyLoans();
  const { data: myFines } = useMyFines();
  const { data: overview } = useReportsOverview();
  const { data: overdue } = useOverdueSummary();
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

  function closePasswordModal() {
    setShowPasswordModal(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
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
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[#0f1c3a]">{vi.nav.dashboard}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xin chào, <span className="font-medium text-slate-700">{user?.fullName}</span>
            {" · "}
            {user && vi.roles[user.role]}
          </p>
        </div>
        {!isStaff && (
          <Button icon={KeyRound} variant="secondary" size="sm" onClick={openPasswordModal}>
            {vi.auth.changePassword}
          </Button>
        )}
      </div>

      {passwordInfo && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{passwordInfo}</p>
      )}

      {isStaff ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={BookOpen} label={vi.report.totalBooks} value={String(overview?.totalBooks ?? "—")} />
            <StatCard icon={Layers} label={vi.report.totalCopies} value={String(overview?.totalCopies ?? "—")} />
            <StatCard icon={Users} label={vi.report.totalPatrons} value={String(overview?.totalPatrons ?? "—")} />
            <StatCard
              icon={ArrowLeftRight}
              label={vi.report.activeLoans}
              value={String(overview?.activeLoans ?? "—")}
            />
            <StatCard
              icon={AlertTriangle}
              label={vi.report.overdueLoans}
              value={String(overview?.overdueLoans ?? "—")}
              tone={overview && overview.overdueLoans > 0 ? "danger" : "default"}
            />
            <StatCard
              icon={CircleDollarSign}
              label={vi.report.unpaidFines}
              value={overview ? `${overview.unpaidFinesTotal.toLocaleString("vi-VN")}đ` : "—"}
              tone={overview && overview.unpaidFinesCount > 0 ? "warning" : "default"}
            />
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-[#0f1c3a]">Thao tác nhanh</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction href="/sach/moi" icon={BookOpen} label={vi.book.addNew} />
              <QuickAction href="/ban-doc/moi" icon={Users} label={vi.patron.addNew} />
              <QuickAction href="/muon-tra" icon={ArrowLeftRight} label={vi.nav.loans} />
              <QuickAction href="/bao-cao" icon={BarChart3} label={vi.report.title} />
            </div>
          </div>

          {overdue && overdue.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-[#0f1c3a]">
                  <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={1.75} />
                  {vi.report.overdueSummary}
                </h2>
                <Link href="/bao-cao" className="text-xs font-medium text-[#0f1c3a] hover:underline">
                  Xem tất cả →
                </Link>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
                    <tr>
                      <th className="px-4 py-2">{vi.book.title}</th>
                      <th className="px-4 py-2">{vi.patron.title}</th>
                      <th className="px-4 py-2">{vi.report.daysOverdue}</th>
                      <th className="px-4 py-2">{vi.report.estimatedFine}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdue.slice(0, 5).map((item) => (
                      <tr key={item.loanId} className="border-t border-slate-100">
                        <td className="px-4 py-2 text-slate-800">{item.bookTitle}</td>
                        <td className="px-4 py-2 text-slate-600">
                          {item.patronName} <span className="text-xs text-slate-400">({item.studentCode})</span>
                        </td>
                        <td className="px-4 py-2 font-medium text-red-600">{item.daysOverdue}</td>
                        <td className="px-4 py-2 text-slate-800">
                          {item.estimatedFine.toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-6">
            <Link
              href="/sach"
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#c9a24b] hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f1c3a] text-[#c9a24b]">
                <BookOpen className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-[#0f1c3a]">
                {vi.nav.books}
              </span>
            </Link>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#0f1c3a]">
                <ArrowLeftRight className="h-4 w-4 text-[#c9a24b]" strokeWidth={1.75} />
                {vi.nav.loans}
              </h2>
              <div className="mt-3 space-y-2">
                {(myLoans ?? []).filter((l) => l.status !== "RETURNED").length === 0 && (
                  <p className="text-sm text-slate-400">{vi.loan.noActiveLoans}</p>
                )}
                {myLoans
                  ?.filter((l) => l.status !== "RETURNED")
                  .map((loan) => (
                    <div
                      key={loan.id}
                      className={`rounded-lg border-l-4 bg-white p-3 shadow-sm ring-1 ring-slate-200 ${
                        loan.status === "OVERDUE" ? "border-l-red-500" : "border-l-emerald-500"
                      }`}
                    >
                      <p className="font-medium text-slate-800">{loan.book.title}</p>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {vi.loan.dueDate}: {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                        </span>
                        <span
                          className={
                            loan.status === "OVERDUE"
                              ? "font-semibold text-red-600"
                              : "font-semibold text-emerald-600"
                          }
                        >
                          {vi.loanStatus[loan.status]}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#0f1c3a]">
                <CircleDollarSign className="h-4 w-4 text-[#c9a24b]" strokeWidth={1.75} />
                {vi.fine.myFines}
              </h2>
              <div className="mt-3 space-y-2">
                {(myFines ?? []).filter((f) => f.status === "UNPAID").length === 0 && (
                  <p className="text-sm text-slate-400">{vi.fine.noFines}</p>
                )}
                {myFines
                  ?.filter((f) => f.status === "UNPAID")
                  .map((fine) => (
                    <div
                      key={fine.id}
                      className="rounded-lg border-l-4 border-l-red-500 bg-red-50 p-3 ring-1 ring-red-100"
                    >
                      <p className="font-medium text-red-800">{fine.loan.book.title}</p>
                      <p className="mt-1 text-xs text-red-600">{fine.reason}</p>
                      <p className="mt-1 font-semibold text-red-800">
                        {fine.amount.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}

      <Modal open={showPasswordModal} onClose={closePasswordModal} title={vi.auth.changePassword}>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.auth.currentPassword}</label>
            <input
              autoFocus
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.auth.newPassword}</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.auth.confirmNewPassword}</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          {passwordError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={closePasswordModal}>
              {vi.common.cancel}
            </Button>
            <Button icon={KeyRound} type="submit" size="sm" disabled={changePassword.isPending}>
              {vi.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
