"use client";

import { useState } from "react";
import { AlertTriangle, Clock, Mail } from "lucide-react";
import { ApiError, DESTRUCTIVE_ROLES, vi, type NotifySendResult } from "@thuvien/shared";
import { useAuth } from "@/lib/auth-context";
import {
  useDueSoonLoans,
  useNotificationSettings,
  useOverdueForNotify,
  useSendDueSoon,
  useSendOverdue,
  useUpdateNotificationSettings,
} from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

function SendResultBanner({ result }: { result: NotifySendResult }) {
  if (!result.smtpConfigured) {
    return (
      <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
        {vi.notification.smtpNotConfigured}
      </p>
    );
  }
  return (
    <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      {result.sent}/{result.totalLoans} {vi.notification.sentCount}
      {result.skippedNoEmail > 0 && ` · ${result.skippedNoEmail} ${vi.notification.skippedNoEmailCount}`}
      {result.failed > 0 && ` · ${result.failed} ${vi.notification.failedCount}`}
    </p>
  );
}

export default function ThongBaoPage() {
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

  async function handleToggleAutoSend(checked: boolean) {
    setError(null);
    try {
      await updateSettings.mutateAsync({ autoSendEnabled: checked });
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
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

  return (
    <div>
      <h1 className="text-lg font-semibold text-[#0f1c3a]">{vi.notification.title}</h1>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-slate-800">
            {vi.notification.autoSendToggle}
            {settings && (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                  settings.autoSendEnabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {settings.autoSendEnabled ? vi.notification.autoSendOn : vi.notification.autoSendOff}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">{vi.notification.autoSendToggleDesc}</p>
        </div>
        <Switch
          checked={settings?.autoSendEnabled ?? true}
          onChange={handleToggleAutoSend}
          disabled={!settings || updateSettings.isPending || !canManageSettings}
        />
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[#0f1c3a]">
              <Clock className="h-4 w-4 text-[#c9a24b]" strokeWidth={1.75} />
              {vi.notification.dueSoonTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{vi.notification.dueSoonDesc}</p>
          </div>
          <Button
            icon={Mail}
            onClick={handleSendDueSoon}
            disabled={sendDueSoon.isPending || !dueSoon || dueSoon.length === 0}
          >
            {vi.notification.sendNow}
          </Button>
        </div>

        {dueSoonResult && <SendResultBanner result={dueSoonResult} />}

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
              <tr>
                <th className="px-4 py-2">{vi.common.stt}</th>
                <th className="px-4 py-2">{vi.book.title}</th>
                <th className="px-4 py-2">{vi.patron.title}</th>
                <th className="px-4 py-2">{vi.loan.dueDate}</th>
                <th className="px-4 py-2">{vi.patron.email}</th>
              </tr>
            </thead>
            <tbody>
              {loadingDueSoon && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                    {vi.common.loading}
                  </td>
                </tr>
              )}
              {!loadingDueSoon && dueSoon?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                    {vi.notification.noDueSoon}
                  </td>
                </tr>
              )}
              {dueSoon?.map((item, index) => (
                <tr key={item.loanId} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                  <td className="px-4 py-2 text-slate-800">{item.bookTitle}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {item.patronName} <span className="text-xs text-slate-400">({item.studentCode})</span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {new Date(item.dueDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        item.hasEmail ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.hasEmail ? vi.notification.hasEmail : vi.notification.noEmail}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[#0f1c3a]">
              <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={1.75} />
              {vi.notification.overdueTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{vi.notification.overdueDesc}</p>
          </div>
          <Button
            icon={Mail}
            onClick={handleSendOverdue}
            disabled={sendOverdue.isPending || !overdue || overdue.length === 0}
          >
            {vi.notification.sendNow}
          </Button>
        </div>

        {overdueResult && <SendResultBanner result={overdueResult} />}

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
              <tr>
                <th className="px-4 py-2">{vi.common.stt}</th>
                <th className="px-4 py-2">{vi.book.title}</th>
                <th className="px-4 py-2">{vi.patron.title}</th>
                <th className="px-4 py-2">{vi.report.daysOverdue}</th>
                <th className="px-4 py-2">{vi.report.estimatedFine}</th>
                <th className="px-4 py-2">{vi.patron.email}</th>
              </tr>
            </thead>
            <tbody>
              {loadingOverdue && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                    {vi.common.loading}
                  </td>
                </tr>
              )}
              {!loadingOverdue && overdue?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                    {vi.notification.noOverdue}
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
                  <td className="px-4 py-2 font-medium text-red-600">{item.daysOverdue}</td>
                  <td className="px-4 py-2 text-slate-800">{item.estimatedFine.toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        item.hasEmail ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.hasEmail ? vi.notification.hasEmail : vi.notification.noEmail}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
