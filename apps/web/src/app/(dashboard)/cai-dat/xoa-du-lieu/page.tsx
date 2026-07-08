"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import {
  ApiError,
  DELETE_ALL_CONFIRMATION_PHRASE,
  DELETE_BOOKS_CONFIRMATION_PHRASE,
  DELETE_CATEGORIES_AUTHORS_CONFIRMATION_PHRASE,
  DELETE_LOANS_FINES_CONFIRMATION_PHRASE,
  DELETE_PATRONS_CONFIRMATION_PHRASE,
  vi,
} from "@thuvien/shared";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  useDeleteAllData,
  useDeleteBooksData,
  useDeleteCategoriesAuthorsData,
  useDeleteDataCounts,
  useDeleteLoansFines,
  useDeletePatronsData,
  useDeletionLogs,
} from "@/hooks/use-data-management";

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | null;
    return body?.message ?? fallback;
  }
  return fallback;
}

type ActionKey = "loans_fines" | "patrons" | "books" | "categories_authors";

const ACTION_META: Record<ActionKey, { title: string; desc: string; requiredPhrase: string; phraseLabel: string }> = {
  loans_fines: {
    title: vi.settings.deleteLoansFines,
    desc: vi.settings.deleteLoansFinesDesc,
    requiredPhrase: DELETE_LOANS_FINES_CONFIRMATION_PHRASE,
    phraseLabel: vi.settings.deleteLoansFinesConfirmPhraseLabel,
  },
  patrons: {
    title: vi.settings.deletePatronsData,
    desc: vi.settings.deletePatronsDataDesc,
    requiredPhrase: DELETE_PATRONS_CONFIRMATION_PHRASE,
    phraseLabel: vi.settings.deletePatronsConfirmPhraseLabel,
  },
  books: {
    title: vi.settings.deleteBooksData,
    desc: vi.settings.deleteBooksDataDesc,
    requiredPhrase: DELETE_BOOKS_CONFIRMATION_PHRASE,
    phraseLabel: vi.settings.deleteBooksConfirmPhraseLabel,
  },
  categories_authors: {
    title: vi.settings.deleteCategoriesAuthorsData,
    desc: vi.settings.deleteCategoriesAuthorsDesc,
    requiredPhrase: DELETE_CATEGORIES_AUTHORS_CONFIRMATION_PHRASE,
    phraseLabel: vi.settings.deleteCategoriesAuthorsConfirmPhraseLabel,
  },
};

function actionLabel(action: string): string {
  if (action in ACTION_META) return ACTION_META[action as ActionKey].title;
  if (action === "all") return vi.settings.deleteAllData;
  return action;
}

function DeleteCard({
  title,
  desc,
  countsText,
  disabled,
  disabledHint,
  onOpen,
}: {
  title: string;
  desc: string;
  countsText: string;
  disabled?: boolean;
  disabledHint?: string;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
      {countsText && !disabled && (
        <p className="mt-2 text-xs font-medium text-amber-700">
          {vi.settings.willDelete}: {countsText}
        </p>
      )}
      {disabled && disabledHint && <p className="mt-2 text-xs font-medium text-red-600">{disabledHint}</p>}
      <div className="mt-3">
        <Button icon={Trash2} variant="danger" size="sm" onClick={onOpen} disabled={disabled}>
          {title}
        </Button>
      </div>
    </div>
  );
}

export default function XoaDuLieuPage() {
  const { data: counts } = useDeleteDataCounts();
  const { data: logs } = useDeletionLogs();

  const deleteLoansFines = useDeleteLoansFines();
  const deletePatrons = useDeletePatronsData();
  const deleteBooks = useDeleteBooksData();
  const deleteCategoriesAuthors = useDeleteCategoriesAuthorsData();
  const deleteAll = useDeleteAllData();

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);
  const [modalPhrase, setModalPhrase] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [password, setPassword] = useState("");

  const categoriesBlocked = (counts?.books ?? 0) > 0;
  const modalPending =
    deleteLoansFines.isPending || deletePatrons.isPending || deleteBooks.isPending || deleteCategoriesAuthors.isPending;

  function openModal(action: ActionKey) {
    setError(null);
    setInfo(null);
    setActiveAction(action);
    setModalPhrase("");
    setModalPassword("");
    setModalError(null);
  }

  function closeModal() {
    if (modalPending) return;
    setActiveAction(null);
    setModalPhrase("");
    setModalPassword("");
    setModalError(null);
  }

  async function handleModalConfirm() {
    if (!activeAction) return;
    const meta = ACTION_META[activeAction];
    setModalError(null);
    if (modalPhrase.trim() !== meta.requiredPhrase) {
      setModalError(`Vui lòng gõ đúng "${meta.requiredPhrase}"`);
      return;
    }
    const input = { confirmationPhrase: modalPhrase.trim(), password: modalPassword };
    try {
      if (activeAction === "loans_fines") {
        const result = await deleteLoansFines.mutateAsync(input);
        setInfo(`${result.deletedLoans} ${vi.settings.deleteResultLoans}, ${result.deletedFines} ${vi.settings.deleteResultFines}`);
      } else if (activeAction === "patrons") {
        const result = await deletePatrons.mutateAsync(input);
        setInfo(`${result.deletedPatrons} ${vi.settings.deleteResultPatrons}`);
      } else if (activeAction === "books") {
        const result = await deleteBooks.mutateAsync(input);
        setInfo(`${result.deletedBooks} ${vi.settings.deleteResultBooks}`);
      } else if (activeAction === "categories_authors") {
        const result = await deleteCategoriesAuthors.mutateAsync(input);
        setInfo(
          `${result.deletedCategories} ${vi.settings.deleteResultCategories}, ${result.deletedAuthors} ${vi.settings.deleteResultAuthors}`,
        );
      }
      setActiveAction(null);
      setModalPhrase("");
      setModalPassword("");
    } catch (err) {
      setModalError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeleteAll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      const result = await deleteAll.mutateAsync({ confirmationPhrase: confirmPhrase, password });
      setConfirmPhrase("");
      setPassword("");
      setInfo(
        `${result.deletedLoans} ${vi.settings.deleteResultLoans}, ${result.deletedFines} ${vi.settings.deleteResultFines}, ${result.deletedPatrons} ${vi.settings.deleteResultPatrons}, ${result.deletedBooks} ${vi.settings.deleteResultBooks}, ${result.deletedCategories} ${vi.settings.deleteResultCategories}, ${result.deletedAuthors} ${vi.settings.deleteResultAuthors}`,
      );
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  const canDeleteAll = confirmPhrase.trim() === DELETE_ALL_CONFIRMATION_PHRASE && password.length > 0;

  return (
    <div className="max-w-3xl">
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
          countsText={counts ? `${counts.loans} ${vi.settings.countLoans}, ${counts.fines} ${vi.settings.countFines}` : ""}
          onOpen={() => openModal("loans_fines")}
        />
        <DeleteCard
          title={vi.settings.deletePatronsData}
          desc={vi.settings.deletePatronsDataDesc}
          countsText={counts ? `${counts.patrons} ${vi.settings.countPatrons}` : ""}
          onOpen={() => openModal("patrons")}
        />
        <DeleteCard
          title={vi.settings.deleteBooksData}
          desc={vi.settings.deleteBooksDataDesc}
          countsText={counts ? `${counts.books} ${vi.settings.countBooks}, ${counts.bookCopies} ${vi.settings.countBookCopies}` : ""}
          onOpen={() => openModal("books")}
        />
        <DeleteCard
          title={vi.settings.deleteCategoriesAuthorsData}
          desc={vi.settings.deleteCategoriesAuthorsDesc}
          countsText={
            counts ? `${counts.categories} ${vi.settings.countCategories}, ${counts.authors} ${vi.settings.countAuthors}` : ""
          }
          disabled={categoriesBlocked}
          disabledHint={categoriesBlocked ? vi.settings.deleteCategoriesAuthorsBlocked : undefined}
          onOpen={() => openModal("categories_authors")}
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

      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-800">{vi.settings.deletionLog}</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
              <tr>
                <th className="px-3 py-2">{vi.settings.deletionLogTime}</th>
                <th className="px-3 py-2">{vi.settings.deletionLogActor}</th>
                <th className="px-3 py-2">{vi.settings.deletionLogAction}</th>
                <th className="px-3 py-2">{vi.settings.deletionLogSummary}</th>
              </tr>
            </thead>
            <tbody>
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                    {vi.settings.deletionLogEmpty}
                  </td>
                </tr>
              )}
              {logs?.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-600">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-3 py-2 text-slate-700">{log.actorName}</td>
                  <td className="px-3 py-2 text-slate-700">{actionLabel(log.action)}</td>
                  <td className="px-3 py-2 text-slate-600">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={activeAction !== null} onClose={closeModal} title={activeAction ? ACTION_META[activeAction].title : ""}>
        {activeAction && (
          <div className="space-y-4">
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{ACTION_META[activeAction].desc}</p>
            <div>
              <label className="block text-sm font-medium text-slate-700">{ACTION_META[activeAction].phraseLabel}</label>
              <input
                autoFocus
                value={modalPhrase}
                onChange={(e) => setModalPhrase(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{vi.settings.deleteAllPasswordLabel}</label>
              <input
                type="password"
                value={modalPassword}
                onChange={(e) => setModalPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            {modalError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{modalError}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="ghost" size="sm" onClick={closeModal} disabled={modalPending}>
                {vi.common.cancel}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleModalConfirm}
                disabled={modalPending || modalPhrase.trim() !== ACTION_META[activeAction].requiredPhrase || !modalPassword}
              >
                {ACTION_META[activeAction].title}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
