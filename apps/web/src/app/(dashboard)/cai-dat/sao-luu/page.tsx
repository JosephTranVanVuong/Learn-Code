"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { settingsApi } from "@/lib/resources";
import { Button } from "@/components/ui/button";

export default function SaoLuuPage() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleDownload() {
    setError(null);
    setDownloading(true);
    try {
      const blob = await settingsApi.downloadBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sao-luu-${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    } finally {
      setDownloading(false);
    }
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setInfo(null);
    if (!file.name.endsWith(".db")) {
      setError(vi.settings.restoreInvalidFile);
      return;
    }
    if (!confirm(vi.settings.restoreConfirm)) return;

    const formData = new FormData();
    formData.append("file", file);
    setRestoring(true);
    try {
      await settingsApi.restoreBackup(formData);
      setInfo(vi.settings.restoreSuccess);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/cai-dat" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">
        {vi.settings.backup} / {vi.settings.restore}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{vi.settings.backupRestoreDesc}</p>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-800">{vi.settings.backup}</h2>
        <div className="mt-3">
          <Button icon={Download} onClick={handleDownload} disabled={downloading}>
            {downloading ? vi.common.loading : vi.settings.downloadBackup}
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-800">{vi.settings.restore}</h2>
        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".db"
            onChange={handleRestoreFile}
            className="hidden"
          />
          <Button
            icon={Upload}
            variant="danger"
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
          >
            {restoring ? vi.common.loading : vi.settings.restoreFile}
          </Button>
        </div>
      </div>
    </div>
  );
}
