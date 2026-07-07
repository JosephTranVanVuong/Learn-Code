"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { ApiError, type PatronImportResult, vi } from "@thuvien/shared";
import { patronsApi } from "@/lib/resources";
import { useImportPatronsFromExcel } from "@/hooks/use-patrons";
import { Button } from "@/components/ui/button";

export default function NhapExcelChungSinhPage() {
  const importPatrons = useImportPatronsFromExcel();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatronImportResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleDownloadTemplate() {
    setError(null);
    setDownloading(true);
    try {
      const blob = await patronsApi.downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mau-nhap-chung-sinh.xlsx";
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
      setError(vi.patron.importInvalidType);
      e.target.value = "";
      return;
    }
    setFileName(file.name);
  }

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await importPatrons.mutateAsync(formData);
      setResult(res);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/ban-doc" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.patron.importExcel}</h1>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          Tải file mẫu Excel, điền thông tin độc giả theo đúng cột, rồi tải lên để thêm nhiều độc giả cùng lúc.
        </p>
        <p className="mt-2 text-xs text-slate-400">{vi.patron.importDefaultPasswordNote}</p>

        <Button icon={Download} variant="secondary" className="mt-4" onClick={handleDownloadTemplate} disabled={downloading}>
          {vi.patron.downloadTemplate}
        </Button>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <label className="block text-sm font-medium text-slate-700">{vi.patron.selectExcelFile}</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />

          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button
            icon={Upload}
            className="mt-4"
            onClick={handleImport}
            disabled={!fileName || importPatrons.isPending}
          >
            {importPatrons.isPending ? vi.common.loading : vi.patron.importSubmit}
          </Button>
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-800">{vi.patron.importResultTitle}</h2>
          <div className="mt-3 flex gap-6 text-sm">
            <p>
              <span className="font-semibold text-emerald-600">{result.successCount}</span>{" "}
              <span className="text-slate-600">{vi.patron.importSuccessCount}</span>
            </p>
            <p>
              <span className="font-semibold text-amber-600">{result.duplicateCount}</span>{" "}
              <span className="text-slate-600">{vi.patron.importDuplicateCount}</span>
            </p>
            <p>
              <span className="font-semibold text-red-600">{result.failedCount}</span>{" "}
              <span className="text-slate-600">{vi.patron.importFailedCount}</span>
            </p>
          </div>

          {result.duplicates.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">{vi.patron.importDuplicatesTitle}</p>
              <ul className="mt-1 space-y-1 text-sm">
                {result.duplicates.map((dup, idx) => (
                  <li key={idx} className="rounded-md bg-amber-50 px-3 py-2 text-amber-700">
                    {vi.patron.importRow} {dup.row}: {dup.studentCode}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            {result.errors.length === 0 ? (
              <p className="text-sm text-slate-400">{vi.patron.importNoErrors}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {result.errors.map((err, idx) => (
                  <li key={idx} className="rounded-md bg-red-50 px-3 py-2 text-red-700">
                    {vi.patron.importRow} {err.row}
                    {err.studentCode ? ` (${err.studentCode})` : ""}: {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
