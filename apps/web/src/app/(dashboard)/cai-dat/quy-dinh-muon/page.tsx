"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Pencil, X } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { Button } from "@/components/ui/button";
import { usePatronTypes, useUpdatePatronType } from "@/hooks/use-patron-types";

export default function QuyDinhMuonPage() {
  const { data: types, isLoading } = usePatronTypes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ maxActiveLoans: "", loanPeriodDays: "", maxRenewals: "" });
  const [error, setError] = useState<string | null>(null);

  const updateType = useUpdatePatronType(editingId ?? "__none__");

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  function startEdit(id: string, current: { maxActiveLoans: number; loanPeriodDays: number; maxRenewals: number }) {
    setEditingId(id);
    setForm({
      maxActiveLoans: String(current.maxActiveLoans),
      loanPeriodDays: String(current.loanPeriodDays),
      maxRenewals: String(current.maxRenewals),
    });
  }

  async function handleSave(id: string) {
    setError(null);
    try {
      await updateType.mutateAsync({
        maxActiveLoans: Number(form.maxActiveLoans) || 1,
        loanPeriodDays: Number(form.loanPeriodDays) || 1,
        maxRenewals: Number(form.maxRenewals) || 0,
      });
      setEditingId(null);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  return (
    <div>
      <Link href="/cai-dat" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.settings.loanPolicy}</h1>
      <p className="mt-1 text-sm text-slate-500">{vi.settings.loanPolicyDesc}</p>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
            <tr>
              <th className="px-4 py-2">{vi.settings.patronTypeName}</th>
              <th className="px-4 py-2">{vi.settings.maxActiveLoans}</th>
              <th className="px-4 py-2">{vi.settings.loanPeriodDays}</th>
              <th className="px-4 py-2">{vi.settings.maxRenewals}</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                  {vi.common.loading}
                </td>
              </tr>
            )}
            {types?.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">{t.name}</td>
                {editingId === t.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={1}
                        value={form.maxActiveLoans}
                        onChange={(e) => setForm({ ...form, maxActiveLoans: e.target.value })}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={1}
                        value={form.loanPeriodDays}
                        onChange={(e) => setForm({ ...form, loanPeriodDays: e.target.value })}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        value={form.maxRenewals}
                        onChange={(e) => setForm({ ...form, maxRenewals: e.target.value })}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button icon={Check} size="sm" onClick={() => handleSave(t.id)} disabled={updateType.isPending}>
                          {vi.common.save}
                        </Button>
                        <Button icon={X} variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                          {vi.common.cancel}
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-slate-600">{t.maxActiveLoans}</td>
                    <td className="px-4 py-2 text-slate-600">{t.loanPeriodDays}</td>
                    <td className="px-4 py-2 text-slate-600">{t.maxRenewals}</td>
                    <td className="px-4 py-2 text-right">
                      <Button icon={Pencil} variant="ghost" size="sm" onClick={() => startEdit(t.id, t)}>
                        {vi.common.edit}
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
