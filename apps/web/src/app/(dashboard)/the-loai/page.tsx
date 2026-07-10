"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { ApiError, DESTRUCTIVE_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "@/lib/auth-context";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";

export default function TheLoaiPage() {
  const { user } = useAuth();
  const canDelete = user ? DESTRUCTIVE_ROLES.includes(user.role) : false;
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [newDdcPrefix, setNewDdcPrefix] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDdcPrefix, setEditingDdcPrefix] = useState("");
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
      await createCategory.mutateAsync({ name: newName.trim(), ddcPrefix: newDdcPrefix.trim() || undefined });
      setNewName("");
      setNewDdcPrefix("");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleUpdate(id: string) {
    setError(null);
    try {
      await updateCategory.mutateAsync({
        id,
        input: { name: editingName.trim(), ddcPrefix: editingDdcPrefix.trim() },
      });
      setEditingId(null);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    if (!confirm(vi.category.deleteConfirm)) return;
    try {
      await deleteCategory.mutateAsync(id);
    } catch (err) {
      setError(extractMessage(err, vi.category.deleteBlocked));
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800">{vi.category.title}</h1>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={vi.category.name}
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <input
          value={newDdcPrefix}
          onChange={(e) => setNewDdcPrefix(e.target.value)}
          placeholder={vi.category.ddcPrefixPlaceholder}
          className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <Button icon={Plus} type="submit" disabled={createCategory.isPending}>
          {vi.category.addNew}
        </Button>
      </form>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
            <tr>
              <th className="px-4 py-2">{vi.common.stt}</th>
              <th className="px-4 py-2">{vi.category.name}</th>
              <th className="px-4 py-2">{vi.category.ddcPrefix}</th>
              <th className="px-4 py-2">{vi.category.bookCount}</th>
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
            {!isLoading && categories?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                  {vi.common.noData}
                </td>
              </tr>
            )}
            {categories?.map((cat, index) => (
              <tr key={cat.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                <td className="px-4 py-2">
                  {editingId === cat.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    cat.name
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {editingId === cat.id ? (
                    <input
                      value={editingDdcPrefix}
                      onChange={(e) => setEditingDdcPrefix(e.target.value)}
                      placeholder={vi.category.ddcPrefixPlaceholder}
                      className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    cat.ddcPrefix ?? "—"
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{cat.bookCount ?? 0}</td>
                <td className="px-4 py-2 text-right">
                  {editingId === cat.id ? (
                    <div className="flex justify-end gap-2">
                      <Button icon={Check} size="sm" onClick={() => handleUpdate(cat.id)}>
                        {vi.common.save}
                      </Button>
                      <Button icon={X} variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        {vi.common.cancel}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button
                        icon={Pencil}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                          setEditingDdcPrefix(cat.ddcPrefix ?? "");
                        }}
                      >
                        {vi.common.edit}
                      </Button>
                      {canDelete && (
                        <Button icon={Trash2} variant="danger" size="sm" onClick={() => handleDelete(cat.id)}>
                          {vi.common.delete}
                        </Button>
                      )}
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
