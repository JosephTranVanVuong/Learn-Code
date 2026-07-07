"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { Button } from "@/components/ui/button";
import { useEmailStatus, useSendTestEmail } from "@/hooks/use-settings";

export default function EmailSettingsPage() {
  const { data: status, isLoading } = useEmailStatus();
  const sendTestEmail = useSendTestEmail();

  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await sendTestEmail.mutateAsync({ to });
      setInfo(vi.settings.testEmailSent);
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
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.settings.email}</h1>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 text-sm">
        {status?.configured ? (
          <>
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">{vi.settings.emailConfigured}</p>
            <p className="mt-3 text-slate-600">
              <span className="font-medium text-slate-700">{vi.settings.emailHost}:</span> {status.host}:{status.port}
            </p>
            <p className="mt-1 text-slate-600">
              <span className="font-medium text-slate-700">{vi.settings.emailFrom}:</span> {status.from}
            </p>
          </>
        ) : (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-700">{vi.settings.emailNotConfigured}</p>
        )}
      </div>

      <form onSubmit={handleSendTest} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.settings.testEmailTo}</label>
          <input
            type="email"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

        <div className="flex justify-end">
          <Button icon={Send} type="submit" disabled={sendTestEmail.isPending || !status?.configured}>
            {vi.settings.sendTestEmail}
          </Button>
        </div>
      </form>
    </div>
  );
}
