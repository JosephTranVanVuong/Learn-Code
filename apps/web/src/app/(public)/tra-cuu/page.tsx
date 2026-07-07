"use client";

import { useState } from "react";
import Link from "next/link";
import { Library, Search } from "lucide-react";
import { vi } from "@thuvien/shared";
import { resolveAssetUrl } from "@/lib/asset-url";
import { useBooks } from "@/hooks/use-books";
import { useCategories } from "@/hooks/use-categories";

export default function TraCuuPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  const { data: categories } = useCategories();
  const { data, isLoading } = useBooks({
    search: search || undefined,
    categoryId: categoryId || undefined,
    availableOnly: availableOnly || undefined,
    page: 1,
    pageSize: 60,
  });

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f1c3a]">
            <Library className="h-5 w-5 text-[#c9a24b]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#0f1c3a]">{vi.publicCatalog.title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{vi.publicCatalog.subtitle}</p>
          </div>
        </div>
        <Link href="/dang-nhap" className="mt-2 text-sm text-slate-500 hover:underline">
          {vi.publicCatalog.backToLogin}
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={vi.book.searchPlaceholder}
            className="w-72 rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-[#0f1c3a] focus:outline-none focus:ring-1 focus:ring-[#0f1c3a]"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0f1c3a] focus:outline-none focus:ring-1 focus:ring-[#0f1c3a]"
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
          <Link key={book.id} href={`/tra-cuu/${book.id}`} className="group">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg">
              {book.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveAssetUrl(book.coverImageUrl) ?? undefined}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0f1c3a] to-[#1c2f57] p-3 text-center">
                  <span className="text-xs font-medium leading-snug text-[#c9a24b]/80">{book.title}</span>
                </div>
              )}
              <span
                className={`absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${
                  book.availableCopies > 0 ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                }`}
              >
                {book.availableCopies}/{book.totalCopies}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-[#0f1c3a]">
              {book.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{book.author.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
