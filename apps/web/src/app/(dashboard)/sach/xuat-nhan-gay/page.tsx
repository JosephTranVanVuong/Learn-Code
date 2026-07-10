"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckSquare, FileDown, ScanLine, Square, Trash2 } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { useBook, useBooks, useSpineLabelExportSummary } from "@/hooks/use-books";
import { useCategories } from "@/hooks/use-categories";
import { booksApi, copiesApi } from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

function extractMessage(err: unknown, fallback: string): string {
  const body = err instanceof ApiError ? (err.body as { message?: string } | null) : null;
  return body?.message ?? fallback;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type Tab = "sach" | "ma-cu-the";

function ByBookPanel() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [onlyUnprinted, setOnlyUnprinted] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportInfo, setExportInfo] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data: summary, isLoading, refetch } = useSpineLabelExportSummary({
    search: search || undefined,
    categoryId: categoryId || undefined,
  });

  const visibleBooks = (summary ?? []).filter((b) => !onlyUnprinted || b.unprintedCopies > 0);

  useEffect(() => {
    setSelected(new Set(visibleBooks.map((b) => b.bookId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, onlyUnprinted, search, categoryId]);

  function toggle(bookId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }

  const selectedBooks = visibleBooks.filter((b) => selected.has(b.bookId));
  const estimatedLabels = selectedBooks.reduce(
    (sum, b) => sum + (onlyUnprinted ? b.unprintedCopies : b.totalCopies),
    0,
  );

  async function handleExport() {
    setExportError(null);
    setExportInfo(null);
    setExporting(true);
    try {
      const blob = await booksApi.exportSpineLabelsBulk({
        bookIds: selectedBooks.map((b) => b.bookId),
        onlyUnprinted,
      });
      downloadBlob(blob, "nhan-gay-hang-loat.docx");
      setExportInfo(`${vi.common.save} ✓ (${estimatedLabels} ${vi.copy.title.toLowerCase()})`);
      await refetch();
    } catch (err) {
      setExportError(extractMessage(err, vi.common.error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={vi.book.searchPlaceholder}
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">{vi.book.category}</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Switch checked={onlyUnprinted} onChange={setOnlyUnprinted} />
            Chỉ hiện sách còn bản chưa in
          </label>
        </div>
        <Button
          icon={FileDown}
          onClick={handleExport}
          disabled={selectedBooks.length === 0 || exporting || estimatedLabels === 0}
        >
          {exporting ? vi.common.loading : `${vi.copy.printSelectedSpineLabels} (${estimatedLabels})`}
        </Button>
      </div>

      {exportError && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{exportError}</p>}
      {exportInfo && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{exportInfo}</p>}

      <div className="mt-3 flex gap-4 text-sm">
        <button
          onClick={() => setSelected(new Set(visibleBooks.map((b) => b.bookId)))}
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
              <th className="px-4 py-2">{vi.book.title}</th>
              <th className="px-4 py-2">{vi.book.author}</th>
              <th className="px-4 py-2">{vi.book.callNumber}</th>
              <th className="px-4 py-2">{vi.copy.title}</th>
              <th className="px-4 py-2">{vi.copy.spineLabelPrintStatus}</th>
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
            {!isLoading && visibleBooks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                  {vi.common.noData}
                </td>
              </tr>
            )}
            {visibleBooks.map((book) => (
              <tr key={book.bookId} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <input type="checkbox" checked={selected.has(book.bookId)} onChange={() => toggle(book.bookId)} />
                </td>
                <td className="px-4 py-2 text-slate-800">{book.title}</td>
                <td className="px-4 py-2 text-slate-600">{book.authorName}</td>
                <td className="px-4 py-2 text-slate-600">
                  {[book.classificationNumber, book.authorMark].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-4 py-2 text-slate-600">{book.totalCopies}</td>
                <td className="px-4 py-2">
                  {book.unprintedCopies > 0 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {vi.copy.spineLabelNotPrinted} ({book.unprintedCopies})
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      {vi.copy.spineLabelPrinted}
                    </span>
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

interface CartItem {
  copyId: string;
  barcode: string;
  bookTitle: string;
  callNumber: string;
}

function BySpecificCopyPanel() {
  const [bookSearch, setBookSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: books } = useBooks({ search: bookSearch || undefined, page: 1, pageSize: 10 });
  const { data: selectedBook } = useBook(bookId || undefined);

  function addToCart(item: CartItem) {
    setError(null);
    if (cart.some((c) => c.copyId === item.copyId)) {
      setError(vi.loan.cartAlreadyIn);
      return;
    }
    setCart((c) => [...c, item]);
  }

  function removeFromCart(copyId: string) {
    setCart((c) => c.filter((item) => item.copyId !== copyId));
  }

  async function handleExport() {
    setError(null);
    setInfo(null);
    setExporting(true);
    try {
      const blob = await copiesApi.exportSpineLabels({ copyIds: cart.map((c) => c.copyId) });
      downloadBlob(blob, "nhan-gay-in-lai.docx");
      setInfo(`${vi.common.save} ✓ (${cart.length} ${vi.copy.title.toLowerCase()})`);
      setCart([]);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    } finally {
      setExporting(false);
    }
  }

  const selectedBookCallNumber = selectedBook
    ? [selectedBook.classificationNumber, selectedBook.authorMark].filter(Boolean).join(" ") || "—"
    : "";

  return (
    <div className="mt-4 space-y-4">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">Tìm sách để chọn bản sao cần in lại</h2>
        <div className="relative mt-3">
          <input
            value={bookId ? books?.items.find((b) => b.id === bookId)?.title ?? "" : bookSearch}
            onChange={(e) => {
              setBookId("");
              setBookSearch(e.target.value);
            }}
            placeholder={vi.book.searchPlaceholder}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          {bookSearch && !bookId && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
              {books?.items.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBookId(b.id);
                    setBookSearch("");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {b.title} <span className="text-xs text-slate-400">({b.totalCopies} {vi.copy.title.toLowerCase()})</span>
                </button>
              ))}
              {books?.items.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">{vi.book.noResults}</p>}
            </div>
          )}
        </div>

        {bookId && selectedBook && (
          <>
            <p className="mt-3 text-sm text-slate-600">
              {vi.book.callNumber}: <span className="font-medium text-slate-800">{selectedBookCallNumber}</span>
            </p>
            <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">{vi.copy.barcode}</th>
                    <th className="px-4 py-2">{vi.copy.spineLabelPrintStatus}</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBook.copies.map((copy) => {
                    const inCart = cart.some((c) => c.copyId === copy.id);
                    return (
                      <tr key={copy.id} className="border-t border-slate-100">
                        <td className="px-4 py-2 font-mono text-xs text-slate-600">{copy.barcode}</td>
                        <td className="px-4 py-2">
                          {copy.spineLabelPrintedAt ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                              {vi.copy.spineLabelPrinted}
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                              {vi.copy.spineLabelNotPrinted}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            size="sm"
                            variant={inCart ? "secondary" : "primary"}
                            disabled={inCart}
                            onClick={() =>
                              addToCart({
                                copyId: copy.id,
                                barcode: copy.barcode,
                                bookTitle: selectedBook.title,
                                callNumber: selectedBookCallNumber,
                              })
                            }
                          >
                            {inCart ? vi.loan.cartAlreadyIn : vi.loan.cartAdd}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <ScanLine className="h-4 w-4 text-[#c9a24b]" strokeWidth={1.75} />
          Giỏ in lại {cart.length > 0 && `(${cart.length})`}
        </h2>
        {cart.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">{vi.loan.cartEmpty}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {cart.map((item) => (
              <li
                key={item.copyId}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span>
                  {item.bookTitle}{" "}
                  <span className="font-mono text-xs text-slate-400">
                    ({item.barcode} · {item.callNumber})
                  </span>
                </span>
                <button
                  onClick={() => removeFromCart(item.copyId)}
                  className="text-slate-400 hover:text-red-600"
                  title={vi.loan.cartRemove}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button icon={FileDown} className="mt-4" onClick={handleExport} disabled={cart.length === 0 || exporting}>
          {exporting ? vi.common.loading : `${vi.copy.printSelectedSpineLabels} (${cart.length})`}
        </Button>
      </div>
    </div>
  );
}

export default function XuatNhanGayHangLoatPage() {
  const [tab, setTab] = useState<Tab>("sach");

  const tabs: { key: Tab; label: string }[] = [
    { key: "sach", label: "Theo sách" },
    { key: "ma-cu-the", label: "Theo mã cụ thể" },
  ];

  return (
    <div>
      <Link href="/sach" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>

      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.copy.bulkExportSpineLabels}</h1>

      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key ? "border-[#c9a24b] text-[#0f1c3a]" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "sach" && <ByBookPanel />}
      {tab === "ma-cu-the" && <BySpecificCopyPanel />}
    </div>
  );
}
