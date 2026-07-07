"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { vi } from "@thuvien/shared";
import { resolveAssetUrl } from "@/lib/asset-url";
import { useBook } from "@/hooks/use-books";

function commonCopyLocation(copies: { location: string | null }[]): string | null {
  const withLocation = copies.filter((c) => c.location);
  if (withLocation.length === 0) return null;
  const first = withLocation[0].location;
  return withLocation.every((c) => c.location === first) ? first : null;
}

export default function ChiTietSachCongKhaiPage() {
  const params = useParams<{ id: string }>();
  const { data: book, isLoading } = useBook(params.id);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/tra-cuu"
        className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.publicCatalog.backToSearch}
      </Link>

      {isLoading && <p className="mt-8 text-sm text-slate-400">{vi.common.loading}</p>}
      {!isLoading && !book && <p className="mt-8 text-sm text-slate-400">{vi.book.notFound}</p>}

      {book && (
        <div className="mt-6">
          <div className="flex flex-col gap-8 sm:flex-row">
            <div className="mx-auto w-48 shrink-0 sm:mx-0">
              <div className="aspect-[2/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-md">
                {book.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveAssetUrl(book.coverImageUrl) ?? undefined}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0f1c3a] to-[#1c2f57] p-4 text-center">
                    <span className="text-sm font-medium leading-snug text-[#c9a24b]/80">{book.title}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-[#0f1c3a]">{book.title}</h1>
              <p className="mt-1 text-base text-slate-600">{book.author.name}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f6efdd] px-3 py-1 text-xs font-medium text-[#0f1c3a]">
                  {book.category.name}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    book.availableCopies > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {book.availableCopies}/{book.totalCopies} {vi.book.availability}
                </span>
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
                {book.publisher && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {vi.book.publisher}
                    </dt>
                    <dd className="mt-0.5 text-sm text-slate-700">{book.publisher}</dd>
                  </div>
                )}
                {book.publishedYear && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {vi.book.publishedYear}
                    </dt>
                    <dd className="mt-0.5 text-sm text-slate-700">{book.publishedYear}</dd>
                  </div>
                )}
                {book.isbn && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{vi.book.isbn}</dt>
                    <dd className="mt-0.5 font-mono text-sm text-slate-700">{book.isbn}</dd>
                  </div>
                )}
                {book.language && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {vi.book.language}
                    </dt>
                    <dd className="mt-0.5 text-sm text-slate-700">{book.language}</dd>
                  </div>
                )}
                {commonCopyLocation(book.copies) && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {vi.copy.location}
                    </dt>
                    <dd className="mt-0.5 text-sm text-slate-700">{commonCopyLocation(book.copies)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-sm font-semibold text-[#0f1c3a]">{vi.book.description}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {book.description || vi.book.noDescription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
