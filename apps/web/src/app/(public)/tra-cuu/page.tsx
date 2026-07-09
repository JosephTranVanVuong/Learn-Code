"use client";

import { useState } from "react";
import Link from "next/link";
import { Library, Search } from "lucide-react";
import { vi } from "@thuvien/shared";
import { useBooks } from "@/hooks/use-books";
import { useCategories } from "@/hooks/use-categories";
import { BookGridItem } from "@/components/book-grid-item";

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
          <BookGridItem key={book.id} book={book} href={`/tra-cuu/${book.id}`} />
        ))}
      </div>
    </div>
  );
}
