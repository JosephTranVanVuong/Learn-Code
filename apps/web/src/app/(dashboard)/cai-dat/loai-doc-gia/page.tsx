"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { Button } from "@/components/ui/button";
import {
  useCreatePatronType,
  useDeletePatronType,
  usePatronTypes,
  useSetDefaultPatronType,
  useUpdatePatronType,
} from "@/hooks/use-patron-types";

const DEFAULT_POLICY = { maxActiveLoans: 5, loanPeriodDays: 14, maxRenewals: 1 };

export default function LoaiDocGiaPage() {
  const { data: types, isLoading } = usePatronTypes();
  const createType = useCreatePatronType();
  const setDefaultType = useSetDefaultPatronType();
  const deleteType = useDeletePatronType();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newName.trim()) return;
    try {
      await createType.mutateAsync({ name: newName.trim(), ...DEFAULT_POLICY });
      setNewName("");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function handleUpdate(id: string) {
    return updatePatronTypeName(id, editingName.trim());
  }

  const updateTypeMutation = useUpdatePatronType(editingId ?? "__none__");

  async function updatePatronTypeName(id: string, name: string) {
    setError(null);
    try {
      await updateTypeMutation.mutateAsync({ name });
      setEditingId(null);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleSetDefault(id: string) {
    setError(null);
    try {
      await setDefaultType.mutateAsync(id);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(vi.settings.deletePatronTypeConfirm)) return;
    setError(null);
    try {
      await deleteType.mutateAsync(id);
    } catch (err) {
      setError(extractMessage(err, vi.settings.deletePatronTypeBlocked));
    }
  }

  return (
    <div>
      <Link href="/cai-dat" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.settings.patronTypes}</h1>
      <p className="mt-1 text-sm text-slate-500">{vi.settings.defaultTypeNote}</p>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={vi.settings.patronTypeName}
          className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <Button icon={Plus} type="submit" disabled={createType.isPending}>
          {vi.settings.addPatronType}
        </Button>
      </form>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
            <tr>
              <th className="px-4 py-2">{vi.common.stt}</th>
              <th className="px-4 py-2">{vi.settings.patronTypeName}</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                  {vi.common.loading}
                </td>
              </tr>
            )}
            {types?.map((t, index) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                <td className="px-4 py-2">
                  {editingId === t.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="flex items-center gap-2">
                      {t.name}
                      {t.isDefault && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                          {vi.settings.isDefaultType}
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {editingId === t.id ? (
                    <div className="flex justify-end gap-2">
                      <Button icon={Check} size="sm" onClick={() => handleUpdate(t.id)}>
                        {vi.common.save}
                      </Button>
                      <Button icon={X} variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        {vi.common.cancel}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      {!t.isDefault && (
                        <Button icon={Star} variant="ghost" size="sm" onClick={() => handleSetDefault(t.id)}>
                          {vi.settings.setAsDefault}
                        </Button>
                      )}
                      <Button
                        icon={Pencil}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(t.id);
                          setEditingName(t.name);
                        }}
                      >
                        {vi.common.edit}
                      </Button>
                      <Button icon={Trash2} variant="danger" size="sm" onClick={() => handleDelete(t.id)}>
                        {vi.common.delete}
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
