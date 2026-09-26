"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { Button } from "@/components/ui/button";
import { useBarcodeSettings, useUpdateBarcodeSettings } from "@/hooks/use-settings";

export default function BarcodeSettingsPage() {
  const { data: settings, isLoading } = useBarcodeSettings();
  const updateSettings = useUpdateBarcodeSettings();

  const [prefix, setPrefix] = useState("");
  const [nextSequenceNumber, setNextSequenceNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setPrefix(settings.prefix ?? "");
      setNextSequenceNumber(settings.nextSequenceNumber != null ? String(settings.nextSequenceNumber) : "");
      setInitialized(true);
    }
  }, [settings, initialized]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      const trimmedSeq = nextSequenceNumber.trim();
      await updateSettings.mutateAsync({
        prefix: prefix.trim() || null,
        nextSequenceNumber: trimmedSeq ? Number.parseInt(trimmedSeq, 10) : null,
      });
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

  const seqTrimmed = nextSequenceNumber.trim();
  const example = seqTrimmed
    ? `${prefix.trim()}${seqTrimmed.padStart(7, "0")}`
    : prefix.trim()
      ? `${prefix.trim()}-ABC123-1`
      : "ABC123-1";

  return (
    <div className="max-w-md">
      <Link href="/cai-dat" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.settings.barcode}</h1>

      <form onSubmit={handleSave} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.settings.barcodePrefix}</label>
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder={vi.settings.barcodePrefixPlaceholder}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            {vi.settings.barcodePreview}: <span className="font-mono">{example}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.settings.barcodeNextSequenceNumber}</label>
          <input
            value={nextSequenceNumber}
            onChange={(e) => setNextSequenceNumber(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={vi.settings.barcodeNextSequenceNumberPlaceholder}
            inputMode="numeric"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">{vi.settings.barcodeNextSequenceNumberHint}</p>
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
