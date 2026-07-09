"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Plus, Upload } from "lucide-react";
import { ApiError, STAFF_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "@/lib/auth-context";
import { resolveAssetUrl } from "@/lib/asset-url";
import { booksApi } from "@/lib/resources";
import { useBooks } from "@/hooks/use-books";
import { useCategories } from "@/hooks/use-categories";
import { Button, ButtonLink } from "@/components/ui/button";
import { BookGridItem } from "@/components/book-grid-item";

export default function SachPage() {
  const { user } = useAuth();
  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data, isLoading } = useBooks({
    search: search || undefined,
    categoryId: categoryId || undefined,
    availableOnly: availableOnly || undefined,
    page: 1,
    pageSize: 50,
  });

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      const blob = await booksApi.exportAllBooks();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "danh-sach-sach.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { message?: string } | null) : null;
      setExportError(body?.message ?? vi.common.error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">{vi.nav.books}</h1>
        {isStaff && (
          <div className="flex gap-2">
            <Button icon={Download} variant="secondary" onClick={handleExport} disabled={exporting}>
              {exporting ? vi.common.loading : vi.book.exportExcel}
            </Button>
            <ButtonLink icon={Upload} variant="secondary" href="/sach/nhap-excel">
              {vi.book.importExcel}
            </ButtonLink>
            <ButtonLink icon={Plus} href="/sach/moi">
              {vi.book.addNew}
            </ButtonLink>
          </div>
        )}
      </div>

      {exportError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{exportError}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={vi.book.searchPlaceholder}
          className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="">{vi.book.allCategories}</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          {vi.book.availableOnly}
        </label>
      </div>

      {isStaff ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
              <tr>
                <th className="px-4 py-2">{vi.common.stt}</th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2">{vi.book.title}</th>
                <th className="px-4 py-2">{vi.book.author}</th>
                <th className="px-4 py-2">{vi.category.title}</th>
                <th className="px-4 py-2">{vi.book.availability}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                    {vi.common.loading}
                  </td>
                </tr>
              )}
              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                    {vi.book.noResults}
                  </td>
                </tr>
              )}
              {data?.items.map((book, index) => (
                <tr key={book.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                  <td className="px-4 py-2">
                    {book.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveAssetUrl(book.coverImageUrl) ?? undefined}
                        alt={book.title}
                        className="h-14 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-14 w-10 rounded bg-slate-100" />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/sach/${book.id}`} className="font-medium text-slate-800 hover:underline">
                      {book.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{book.author.name}</td>
                  <td className="px-4 py-2 text-slate-600">{book.category.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {book.availableCopies}/{book.totalCopies} {vi.book.availability}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {!isLoading && data && (
            <p className="mt-4 text-xs text-slate-400">
              {data.total} {vi.book.resultsFound}
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {isLoading && (
              <p className="col-span-full py-10 text-center text-sm text-slate-400">{vi.common.loading}</p>
            )}
            {!isLoading && data?.items.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-slate-400">{vi.book.noResults}</p>
            )}
            {data?.items.map((book) => (
              <BookGridItem key={book.id} book={book} href={`/sach/${book.id}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
