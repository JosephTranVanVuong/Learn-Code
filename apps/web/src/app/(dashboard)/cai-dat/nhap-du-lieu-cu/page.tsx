"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Upload } from "lucide-react";
import { ApiError, type OldSystemImportResult, type OldSystemBookImportResult, vi } from "@thuvien/shared";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useImportOldSystemFromAccess, useImportOldSystemBooksFromExcel } from "@/hooks/use-old-system-import";

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | null;
    return body?.message ?? fallback;
  }
  return fallback;
}

function BookResultRows({ result }: { result: OldSystemBookImportResult }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
      <p><span className="font-semibold text-emerald-600">{result.booksCreated}</span> <span className="text-slate-600">{vi.settings.importOldSystemBooksCreated}</span></p>
      <p><span className="font-semibold text-emerald-600">{result.copiesCreated}</span> <span className="text-slate-600">{vi.settings.importOldSystemCopiesCreated}</span></p>
      <p><span className="font-semibold text-amber-600">{result.copiesSkipped}</span> <span className="text-slate-600">{vi.settings.importOldSystemCopiesSkipped}</span></p>
      <p><span className="font-semibold text-slate-700">{result.authorsCreated}</span> <span className="text-slate-600">{vi.settings.importOldSystemAuthorsCreated}</span></p>
      <p><span className="font-semibold text-slate-700">{result.categoriesCreated}</span> <span className="text-slate-600">{vi.settings.importOldSystemCategoriesCreated}</span></p>
    </div>
  );
}

export default function ImportOldSystemPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "QUAN_TRI";

  const importAccess = useImportOldSystemFromAccess();
  const importExcel = useImportOldSystemBooksFromExcel();

  const [filePath, setFilePath] = useState("");
  const [importBooks, setImportBooks] = useState(true);
  const [importPatrons, setImportPatrons] = useState(true);
  const [importLoans, setImportLoans] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessResult, setAccessResult] = useState<OldSystemImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelFileName, setExcelFileName] = useState("");
  const [excelError, setExcelError] = useState<string | null>(null);
  const [excelResult, setExcelResult] = useState<OldSystemBookImportResult | null>(null);

  async function handleAccessImport() {
    setAccessError(null);
    setAccessResult(null);
    try {
      const res = await importAccess.mutateAsync({
        filePath: filePath.trim(),
        importBooks,
        importPatrons,
        importLoans,
      });
      setAccessResult(res);
    } catch (err) {
      setAccessError(extractMessage(err, vi.common.error));
    }
  }

  function handleExcelFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelError(null);
    setExcelResult(null);
    if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
      setExcelError(vi.book.importInvalidType);
      e.target.value = "";
      return;
    }
    setExcelFileName(file.name);
  }

  async function handleExcelImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setExcelError(null);
    setExcelResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await importExcel.mutateAsync(formData);
      setExcelResult(res);
      setExcelFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setExcelError(extractMessage(err, vi.common.error));
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/cai-dat" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.settings.importOldSystem}</h1>
      <p className="mt-1 text-sm text-slate-600">{vi.settings.importOldSystemDesc}</p>

      {isAdmin && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Database className="h-4 w-4" strokeWidth={1.75} />
            {vi.settings.importOldSystemAccessTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{vi.settings.importOldSystemAccessDesc}</p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">{vi.settings.importOldSystemFilePathLabel}</label>
            <input
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder={vi.settings.importOldSystemFilePathPlaceholder}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={importBooks} onChange={(e) => setImportBooks(e.target.checked)} />
              {vi.settings.importOldSystemImportBooks}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={importPatrons} onChange={(e) => setImportPatrons(e.target.checked)} />
              {vi.settings.importOldSystemImportPatrons}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={importLoans} onChange={(e) => setImportLoans(e.target.checked)} />
              {vi.settings.importOldSystemImportLoans}
            </label>
          </div>

          {accessError && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{accessError}</p>}

          <Button
            className="mt-4"
            onClick={handleAccessImport}
            disabled={!filePath.trim() || (!importBooks && !importPatrons && !importLoans) || importAccess.isPending}
          >
            {importAccess.isPending ? vi.common.loading : vi.settings.importOldSystemRun}
          </Button>

          {accessResult && (
            <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
              {accessResult.books && (
                <div>
                  <p className="text-sm font-medium text-slate-700">{vi.settings.importOldSystemImportBooks}</p>
                  <BookResultRows result={accessResult.books} />
                </div>
              )}
              {accessResult.patrons && (
                <div>
                  <p className="text-sm font-medium text-slate-700">{vi.settings.importOldSystemImportPatrons}</p>
                  <div className="mt-2 flex gap-6 text-sm">
                    <p><span className="font-semibold text-emerald-600">{accessResult.patrons.patronsCreated}</span> <span className="text-slate-600">{vi.settings.importOldSystemPatronsCreated}</span></p>
                    <p><span className="font-semibold text-amber-600">{accessResult.patrons.patronsSkipped}</span> <span className="text-slate-600">{vi.settings.importOldSystemPatronsSkipped}</span></p>
                  </div>
                </div>
              )}
              {accessResult.loans && (
                <div>
                  <p className="text-sm font-medium text-slate-700">{vi.settings.importOldSystemImportLoans}</p>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <p><span className="font-semibold text-emerald-600">{accessResult.loans.loansCreated}</span> <span className="text-slate-600">{vi.settings.importOldSystemLoansCreated}</span></p>
                    <p><span className="font-semibold text-amber-600">{accessResult.loans.loansSkipped}</span> <span className="text-slate-600">{vi.settings.importOldSystemLoansSkipped}</span></p>
                    <p><span className="font-semibold text-slate-500">{accessResult.loans.skippedOrphanPatron + accessResult.loans.skippedOrphanCopy}</span> <span className="text-slate-600">{vi.settings.importOldSystemSkippedOrphan}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-800">{vi.settings.importOldSystemExcelTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{vi.settings.importOldSystemExcelDesc}</p>

        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelFileChange}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />

          {excelError && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{excelError}</p>}

          <Button icon={Upload} className="mt-4" onClick={handleExcelImport} disabled={!excelFileName || importExcel.isPending}>
            {importExcel.isPending ? vi.common.loading : vi.settings.importOldSystemRun}
          </Button>
        </div>

        {excelResult && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <BookResultRows result={excelResult} />
          </div>
        )}
      </div>
    </div>
  );
}
