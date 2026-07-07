"use client";

import { useState } from "react";
import { Ban, CircleCheck } from "lucide-react";
import { ApiError, vi, type FineStatus } from "@thuvien/shared";
import { useFines, usePayFine, useWaiveFine } from "@/hooks/use-fines";
import { Button } from "@/components/ui/button";

const STATUS_FILTERS: { value: FineStatus; label: string }[] = [
  { value: "UNPAID", label: vi.fineStatus.UNPAID },
  { value: "PAID", label: vi.fineStatus.PAID },
  { value: "WAIVED", label: vi.fineStatus.WAIVED },
];

export default function PhatPage() {
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

  async function handlePay(id: string) {
    setError(null);
    if (!confirm(vi.fine.payConfirm)) return;
    try {
      await payFine.mutateAsync(id);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleWaive(id: string) {
    setError(null);
    if (!confirm(vi.fine.waiveConfirm)) return;
    try {
      await waiveFine.mutateAsync(id);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800">{vi.fine.title}</h1>

      <div className="mt-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm w-fit">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-md px-4 py-1.5 font-medium transition ${
              status === f.value ? "bg-white shadow text-slate-900" : "text-slate-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
            <tr>
              <th className="px-4 py-2">{vi.common.stt}</th>
              <th className="px-4 py-2">{vi.patron.title}</th>
              <th className="px-4 py-2">{vi.book.title}</th>
              <th className="px-4 py-2">{vi.fine.reason}</th>
              <th className="px-4 py-2">{vi.fine.amount}</th>
              <th className="px-4 py-2">{vi.copy.status}</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                  {vi.common.loading}
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                  {vi.fine.noFines}
                </td>
              </tr>
            )}
            {data?.items.map((fine, index) => (
              <tr key={fine.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                <td className="px-4 py-2 text-slate-800">{fine.patron.fullName}</td>
                <td className="px-4 py-2 text-slate-600">{fine.loan.book.title}</td>
                <td className="px-4 py-2 text-slate-600">{fine.reason}</td>
                <td className="px-4 py-2 font-medium text-slate-800">
                  {fine.amount.toLocaleString("vi-VN")}đ
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      fine.status === "UNPAID"
                        ? "bg-red-50 text-red-700"
                        : fine.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {vi.fineStatus[fine.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  {fine.status === "UNPAID" && (
                    <div className="flex justify-end gap-2">
                      <Button icon={Ban} variant="ghost" size="sm" onClick={() => handleWaive(fine.id)}>
                        {vi.fine.waive}
                      </Button>
                      <Button icon={CircleCheck} size="sm" onClick={() => handlePay(fine.id)}>
                        {vi.fine.pay}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
