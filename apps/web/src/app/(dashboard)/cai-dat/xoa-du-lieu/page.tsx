"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { ApiError, DELETE_ALL_CONFIRMATION_PHRASE, vi } from "@thuvien/shared";
import { Button } from "@/components/ui/button";
import {
  useDeleteAllData,
  useDeleteBooksData,
  useDeleteCategoriesAuthorsData,
  useDeleteLoansFines,
  useDeletePatronsData,
} from "@/hooks/use-data-management";

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | null;
    return body?.message ?? fallback;
  }
  return fallback;
}

function DeleteCard({
  title,
  desc,
  confirmText,
  onConfirm,
  pending,
}: {
  title: string;
  desc: string;
  confirmText: string;
  onConfirm: () => Promise<void>;
  pending: boolean;
}) {
  async function handleClick() {
    if (!confirm(confirmText)) return;
    await onConfirm();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
      <div className="mt-3">
        <Button icon={Trash2} variant="danger" size="sm" onClick={handleClick} disabled={pending}>
          {pending ? vi.common.loading : title}
        </Button>
      </div>
    </div>
  );
}

export default function XoaDuLieuPage() {
  const deleteLoansFines = useDeleteLoansFines();
  const deletePatrons = useDeletePatronsData();
  const deleteBooks = useDeleteBooksData();
  const deleteCategoriesAuthors = useDeleteCategoriesAuthorsData();
  const deleteAll = useDeleteAllData();

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [password, setPassword] = useState("");

  async function handleDeleteLoansFines() {
    setError(null);
    setInfo(null);
    try {
      const result = await deleteLoansFines.mutateAsync();
      setInfo(`${result.deletedLoans} ${vi.settings.deleteResultLoans}, ${result.deletedFines} ${vi.settings.deleteResultFines}`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeletePatrons() {
    setError(null);
    setInfo(null);
    try {
      const result = await deletePatrons.mutateAsync();
      setInfo(`${result.deletedPatrons} ${vi.settings.deleteResultPatrons}`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeleteBooks() {
    setError(null);
    setInfo(null);
    try {
      const result = await deleteBooks.mutateAsync();
      setInfo(`${result.deletedBooks} ${vi.settings.deleteResultBooks}`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeleteCategoriesAuthors() {
    setError(null);
    setInfo(null);
    try {
      await deleteCategoriesAuthors.mutateAsync();
      setInfo(vi.settings.deleteSuccess);
    } catch (err) {
      setError(extractMessage(err, vi.settings.deleteCategoriesAuthorsBlocked));
    }
  }

  async function handleDeleteAll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await deleteAll.mutateAsync({ confirmationPhrase: confirmPhrase, password });
      setConfirmPhrase("");
      setPassword("");
      setInfo(vi.settings.deleteSuccess);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  const canDeleteAll = confirmPhrase.trim() === DELETE_ALL_CONFIRMATION_PHRASE && password.length > 0;

  return (
    <div className="max-w-2xl">
      <Link href="/cai-dat" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.settings.deleteData}</h1>
      <p className="mt-1 text-sm text-slate-500">{vi.settings.deleteDataDesc}</p>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <DeleteCard
          title={vi.settings.deleteLoansFines}
          desc={vi.settings.deleteLoansFinesDesc}
          confirmText={vi.settings.deleteLoansFinesConfirm}
          onConfirm={handleDeleteLoansFines}
          pending={deleteLoansFines.isPending}
        />
        <DeleteCard
          title={vi.settings.deletePatronsData}
          desc={vi.settings.deletePatronsDataDesc}
          confirmText={vi.settings.deletePatronsDataConfirm}
          onConfirm={handleDeletePatrons}
          pending={deletePatrons.isPending}
        />
        <DeleteCard
          title={vi.settings.deleteBooksData}
          desc={vi.settings.deleteBooksDataDesc}
          confirmText={vi.settings.deleteBooksDataConfirm}
          onConfirm={handleDeleteBooks}
          pending={deleteBooks.isPending}
        />
        <DeleteCard
          title={vi.settings.deleteCategoriesAuthorsData}
          desc={vi.settings.deleteCategoriesAuthorsDesc}
          confirmText={vi.settings.deleteCategoriesAuthorsConfirm}
          onConfirm={handleDeleteCategoriesAuthors}
          pending={deleteCategoriesAuthors.isPending}
        />
      </div>

      <div className="mt-8 rounded-lg border-2 border-red-200 bg-red-50/50 p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-red-800">{vi.settings.dangerZone}</h2>
        </div>
        <p className="mt-2 text-xs text-red-700">{vi.settings.deleteAllDataDesc}</p>

        <form onSubmit={handleDeleteAll} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.settings.deleteAllConfirmLabel}</label>
            <input
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.settings.deleteAllPasswordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <Button icon={Trash2} type="submit" variant="danger" disabled={!canDeleteAll || deleteAll.isPending}>
            {deleteAll.isPending ? vi.common.loading : vi.settings.deleteAllButton}
          </Button>
        </form>
      </div>
    </div>
  );
}
