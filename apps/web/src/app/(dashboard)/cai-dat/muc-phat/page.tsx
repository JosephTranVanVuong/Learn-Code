"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { Button } from "@/components/ui/button";
import { useFineSettings, useUpdateFineSettings } from "@/hooks/use-settings";

export default function MucPhatPage() {
  const { data: settings, isLoading } = useFineSettings();
  const updateSettings = useUpdateFineSettings();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setAmount(String(settings.finePerDayVnd));
      setInitialized(true);
    }
  }, [settings, initialized]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await updateSettings.mutateAsync({ finePerDayVnd: Number(amount) || 0 });
      setInfo(vi.settings.saved);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | null;
        setError(body?.message ?? vi.common.error);
      } else {
        setError(vi.common.error);
      }
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-400">{vi.common.loading}</p>;
  }

  return (
    <div className="max-w-md">
      <Link href="/cai-dat" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.settings.finePolicy}</h1>

      <form onSubmit={handleSave} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.settings.finePerDayVnd}</label>
          <input
            type="number"
            min={0}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

        <div className="flex justify-end">
          <Button icon={Save} type="submit" disabled={updateSettings.isPending}>
            {vi.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
