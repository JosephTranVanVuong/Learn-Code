"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckSquare, Printer, Square } from "lucide-react";
import { vi } from "@thuvien/shared";
import { useBook } from "@/hooks/use-books";
import { BarcodeLabel } from "@/components/barcode-label";
import { Button } from "@/components/ui/button";

export default function MaVachSachPage() {
  const params = useParams<{ id: string }>();
  const { data: book, isLoading } = useBook(params.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (book) {
      setSelected(new Set(book.copies.map((c) => c.id)));
    }
  }, [book]);

  function toggle(copyId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(copyId)) {
        next.delete(copyId);
      } else {
        next.add(copyId);
      }
      return next;
    });
  }

  if (isLoading || !book) {
    return <p className="text-sm text-slate-400">{vi.common.loading}</p>;
  }

  const selectedCopies = book.copies.filter((c) => selected.has(c.id));

  return (
    <div>
      <div className="no-print mb-6">
        <Link href={`/sach/${params.id}`} className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          {vi.common.back}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">
            {vi.copy.printBarcodes} — {book.title}
          </h1>
          <Button icon={Printer} onClick={() => window.print()} disabled={selectedCopies.length === 0}>
            {vi.copy.printSelectedBarcodes}
          </Button>
        </div>

        {book.copies.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">{vi.copy.noCopiesToPrint}</p>
        ) : (
          <>
            <div className="mt-4 flex gap-4 text-sm">
              <button
                onClick={() => setSelected(new Set(book.copies.map((c) => c.id)))}
                className="flex items-center gap-1.5 text-slate-600 hover:underline"
              >
                <CheckSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                {vi.copy.selectAll}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="flex items-center gap-1.5 text-slate-600 hover:underline"
              >
                <Square className="h-3.5 w-3.5" strokeWidth={1.75} />
                {vi.copy.selectNone}
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
                  <tr>
                    <th className="px-4 py-2"></th>
                    <th className="px-4 py-2">{vi.copy.barcode}</th>
                    <th className="px-4 py-2">{vi.copy.status}</th>
                    <th className="px-4 py-2">{vi.copy.location}</th>
                  </tr>
                </thead>
                <tbody>
                  {book.copies.map((copy) => (
                    <tr key={copy.id} className="border-t border-slate-100">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(copy.id)}
                          onChange={() => toggle(copy.id)}
                        />
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-600">{copy.barcode}</td>
                      <td className="px-4 py-2 text-slate-600">{vi.copyStatus[copy.status]}</td>
                      <td className="px-4 py-2 text-slate-600">{copy.location ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {selectedCopies.map((copy) => (
          <BarcodeLabel key={copy.id} title={book.title} barcode={copy.barcode} location={copy.location} />
        ))}
      </div>
    </div>
  );
}
