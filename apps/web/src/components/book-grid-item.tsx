import Link from "next/link";
import type { BookWithAvailability } from "@thuvien/shared";
import { resolveAssetUrl } from "@/lib/asset-url";

export function BookGridItem({ book, href }: { book: BookWithAvailability; href: string }) {
  return (
    <Link href={href} className="group">
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
      <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-[#0f1c3a]">{book.title}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500">{book.author.name}</p>
    </Link>
  );
}
