"use client";

import { useRef, useState } from "react";
import {
  BookUp,
  CalendarClock,
  Check,
  CheckSquare,
  ClipboardList,
  Download,
  Plus,
  ShoppingBag,
  Square,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { ApiError, vi, type Patron } from "@thuvien/shared";
import { patronsApi, copiesApi, loansApi } from "@/lib/resources";
import { resolveAssetUrl } from "@/lib/asset-url";
import { usePatronLoans, usePatrons } from "@/hooks/use-patrons";
import { usePatronTypes } from "@/hooks/use-patron-types";
import { useBook, useBooks } from "@/hooks/use-books";
import { useCreateLoansBatch, useLoans, useRenewLoan, useReturnByBarcode, useReturnLoan } from "@/hooks/use-loans";
import { useFines } from "@/hooks/use-fines";
import { Button } from "@/components/ui/button";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | null;
    return body?.message ?? fallback;
  }
  return fallback;
}

interface CartItem {
  copyId: string;
  barcode: string;
  title: string;
}

interface ReturnResultItem {
  loanId: string;
  title: string;
  barcode: string;
  fineAmount: number | null;
  error?: string;
}

type Tab = "borrow" | "return" | "active";

function PatronPicker({
  patron,
  onResolved,
  onClear,
  onError,
  autoFocus,
  onScanSuccessFocusNext,
}: {
  patron: Patron | null;
  onResolved: (patron: Patron) => void;
  onClear: () => void;
  onError: (message: string) => void;
  autoFocus?: boolean;
  onScanSuccessFocusNext?: () => void;
}) {
  const [scanInput, setScanInput] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: patrons } = usePatrons({ search: search || undefined, page: 1, pageSize: 10 });

  async function handleScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = scanInput.trim();
    setScanInput("");
    if (!code) return;
    setBusy(true);
    try {
      const found = await patronsApi.getByCode(code);
      onResolved(found);
      onScanSuccessFocusNext?.();
    } catch (err) {
      onError(extractMessage(err, vi.loan.scanPatronNotFound));
    } finally {
      setBusy(false);
    }
  }

  if (patron) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          {patron.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveAssetUrl(patron.avatarUrl) ?? undefined}
              alt={patron.fullName}
              className="aspect-[2/3] w-12 rounded-md border border-emerald-200 object-cover"
            />
          ) : (
            <div className="flex aspect-[2/3] w-12 items-center justify-center rounded-md border border-emerald-200 bg-white text-sm font-semibold text-emerald-700">
              {patron.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-emerald-900">{patron.fullName}</p>
            <p className="text-xs text-emerald-700">
              {patron.studentCode}
              {patron.className ? ` · ${patron.className}` : ""}
            </p>
          </div>
        </div>
        <button onClick={onClear} className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
          <X className="h-3 w-3" strokeWidth={2} />
          {vi.loan.cartChangePatron}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-700">{vi.loan.scanPatronCard}</label>
        <input
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={handleScan}
          placeholder={vi.loan.scanPlaceholder}
          disabled={busy}
          autoFocus={autoFocus}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
        />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-slate-700">{vi.loan.selectPatron}</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={vi.patron.searchPlaceholder}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {search && (
          <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
            {patrons?.items.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onResolved(p);
                  setSearch("");
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-mono text-xs text-slate-500">{p.studentCode}</span> — {p.fullName}
              </button>
            ))}
            {patrons?.items.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">{vi.patron.noResults}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function BorrowPanel() {
  const [patron, setPatron] = useState<Patron | null>(null);
  const [bookSearch, setBookSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [scanBorrowInput, setScanBorrowInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const bookScanRef = useRef<HTMLInputElement>(null);

  const { data: patronLoans } = usePatronLoans(patron?.id);
  const { data: patronFines } = useFines(
    { patronId: patron?.id, status: "UNPAID", page: 1, pageSize: 20 },
    { enabled: Boolean(patron) },
  );
  const activeLoans = (patronLoans ?? []).filter((l) => l.status !== "RETURNED");
  const unpaidFines = patronFines?.items ?? [];
  const totalUnpaid = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

  const { data: books } = useBooks({ search: bookSearch || undefined, availableOnly: true, page: 1, pageSize: 10 });
  const { data: selectedBook } = useBook(bookId || undefined);
  const createLoansBatch = useCreateLoansBatch();

  function handleClearPatron() {
    setPatron(null);
    setCart([]);
    setError(null);
    setInfo(null);
  }

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

  async function handleScanBorrow(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const barcode = scanBorrowInput.trim();
    setScanBorrowInput("");
    if (!barcode) return;
    setError(null);
    if (!patron) {
      setError(vi.loan.cartSelectPatronFirst);
      return;
    }
    setScanBusy(true);
    try {
      const copy = await copiesApi.getByBarcode(barcode);
      if (copy.status !== "AVAILABLE") {
        setError(vi.loan.scanCopyNotAvailable);
        return;
      }
      addToCart({ copyId: copy.id, barcode: copy.barcode, title: copy.book.title });
    } catch (err) {
      setError(extractMessage(err, vi.loan.scanCopyNotFound));
    } finally {
      setScanBusy(false);
    }
  }

  function handleAddSelectedToCart() {
    if (!copyId || !selectedBook) return;
    const copy = selectedBook.copies.find((c) => c.id === copyId);
    if (!copy) return;
    addToCart({ copyId: copy.id, barcode: copy.barcode, title: selectedBook.title });
    setBookId("");
    setBookSearch("");
    setCopyId("");
  }

  async function handleConfirmCart() {
    setError(null);
    setInfo(null);
    if (!patron || cart.length === 0) return;
    try {
      const result = await createLoansBatch.mutateAsync({ patronId: patron.id, copyIds: cart.map((c) => c.copyId) });
      setCart([]);
      setInfo(`${vi.loan.cartBorrowSuccess} (${result.loans.length} ${vi.loan.cartBookCountSuffix})`);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string; unavailableCopyIds?: string[] } | null;
        if (body?.unavailableCopyIds) {
          setCart((c) => c.filter((item) => !body.unavailableCopyIds!.includes(item.copyId)));
          setError(vi.loan.cartCopiesUnavailable);
          return;
        }
        setError(body?.message ?? vi.common.error);
        return;
      }
      setError(vi.common.error);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">{vi.loan.step1SelectPatron}</h2>
        <div className="mt-4">
          <PatronPicker
            patron={patron}
            onResolved={(p) => {
              setPatron(p);
              setCart([]);
              setError(null);
            }}
            onClear={handleClearPatron}
            onError={setError}
            autoFocus
            onScanSuccessFocusNext={() => bookScanRef.current?.focus()}
          />
        </div>

        {patron && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-slate-600">
                {vi.nav.loans} ({activeLoans.length})
              </p>
              {activeLoans.length === 0 ? (
                <p className="mt-1 text-xs text-slate-400">{vi.loan.noActiveLoans}</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {activeLoans.map((loan) => (
                    <li key={loan.id} className="flex items-center justify-between text-xs text-slate-700">
                      <span>
                        {loan.book.title} <span className="font-mono text-[10px] text-slate-400">({loan.copy.barcode})</span>
                      </span>
                      <span className={loan.status === "OVERDUE" ? "font-semibold text-red-600" : ""}>
                        {vi.loanStatus[loan.status]} · {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">{vi.fine.title}</p>
              {unpaidFines.length === 0 ? (
                <p className="mt-1 text-xs text-slate-400">{vi.fine.noFines}</p>
              ) : (
                <>
                  <ul className="mt-1 space-y-1">
                    {unpaidFines.map((fine) => (
                      <li key={fine.id} className="flex items-center justify-between text-xs text-red-700">
                        <span>{fine.reason}</span>
                        <span className="font-semibold">{fine.amount.toLocaleString("vi-VN")}đ</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-xs font-semibold text-red-700">
                    {vi.report.unpaidFines}: {totalUnpaid.toLocaleString("vi-VN")}đ
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">{vi.loan.step2SelectBooks}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.loan.scanBookCode}</label>
            <input
              ref={bookScanRef}
              value={scanBorrowInput}
              onChange={(e) => setScanBorrowInput(e.target.value)}
              onKeyDown={handleScanBorrow}
              placeholder={vi.loan.scanPlaceholder}
              disabled={scanBusy || !patron}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700">{vi.loan.selectCopy}</label>
            <input
              value={bookId ? books?.items.find((b) => b.id === bookId)?.title ?? "" : bookSearch}
              onChange={(e) => {
                setBookId("");
                setCopyId("");
                setBookSearch(e.target.value);
              }}
              placeholder={vi.book.searchPlaceholder}
              disabled={!patron}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
            />
            {bookSearch && !bookId && (
              <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
                {books?.items.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBookId(b.id)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {b.title} <span className="text-xs text-slate-400">({b.availableCopies} {vi.book.availability})</span>
                  </button>
                ))}
                {books?.items.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">{vi.book.noResults}</p>}
              </div>
            )}
            {bookId && selectedBook && (
              <div className="mt-2 flex gap-2">
                <select
                  value={copyId}
                  onChange={(e) => setCopyId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  <option value="">{vi.copy.barcode}</option>
                  {selectedBook.copies
                    .filter((c) => c.status === "AVAILABLE")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.barcode} {c.location ? `(${c.location})` : ""}
                      </option>
                    ))}
                </select>
                <Button icon={Plus} onClick={handleAddSelectedToCart} disabled={!copyId}>
                  {vi.loan.cartAdd}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <ShoppingBag className="h-4 w-4 text-[#c9a24b]" strokeWidth={1.75} />
          {vi.loan.step3ConfirmCart} {cart.length > 0 && `(${cart.length})`}
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
                  {item.title} <span className="font-mono text-xs text-slate-400">({item.barcode})</span>
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
        <Button
          icon={BookUp}
          className="mt-4"
          onClick={handleConfirmCart}
          disabled={createLoansBatch.isPending || !patron || cart.length === 0}
        >
          {vi.loan.cartConfirm} {cart.length > 0 && `(${cart.length} ${vi.loan.cartBookCountSuffix})`}
        </Button>
      </div>
    </div>
  );
}

function ReturnPanel() {
  const [scanReturnInput, setScanReturnInput] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickResult, setQuickResult] = useState<{ title: string; barcode: string; fineAmount: number | null } | null>(
    null,
  );

  const [patron, setPatron] = useState<Patron | null>(null);
  const { data: patronLoans } = usePatronLoans(patron?.id);
  const activeLoans = (patronLoans ?? []).filter((l) => l.status !== "RETURNED");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchResults, setBatchResults] = useState<ReturnResultItem[] | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const returnLoan = useReturnLoan();
  const returnByBarcode = useReturnByBarcode();

  function toggleSelected(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function handleClearPatron() {
    setPatron(null);
    setSelectedIds([]);
    setBatchResults(null);
  }

  async function handleScanReturn(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const barcode = scanReturnInput.trim();
    setScanReturnInput("");
    if (!barcode) return;
    setError(null);
    setQuickResult(null);
    setScanBusy(true);
    try {
      const result = await returnByBarcode.mutateAsync({ barcode });
      setQuickResult({ title: result.book.title, barcode: result.copy.barcode, fineAmount: result.fine?.amount ?? null });
    } catch (err) {
      setError(extractMessage(err, vi.loan.scanNoActiveLoan));
    } finally {
      setScanBusy(false);
    }
  }

  async function handleConfirmReturnCart() {
    setBatchBusy(true);
    setBatchResults(null);
    const results: ReturnResultItem[] = [];
    for (const id of selectedIds) {
      const loan = activeLoans.find((l) => l.id === id);
      try {
        const res = await returnLoan.mutateAsync(id);
        results.push({
          loanId: id,
          title: loan?.book.title ?? "",
          barcode: loan?.copy.barcode ?? "",
          fineAmount: res.fine?.amount ?? null,
        });
      } catch (err) {
        results.push({
          loanId: id,
          title: loan?.book.title ?? "",
          barcode: loan?.copy.barcode ?? "",
          fineAmount: null,
          error: extractMessage(err, vi.common.error),
        });
      }
    }
    setBatchResults(results);
    setSelectedIds([]);
    setBatchBusy(false);
  }

  return (
    <div className="mt-4 space-y-4">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">{vi.loan.quickReturnHeading}</h2>
        <div className="mt-4 max-w-md">
          <label className="block text-sm font-medium text-slate-700">{vi.loan.scanReturnCode}</label>
          <input
            value={scanReturnInput}
            onChange={(e) => setScanReturnInput(e.target.value)}
            onKeyDown={handleScanReturn}
            placeholder={vi.loan.scanPlaceholder}
            disabled={scanBusy}
            autoFocus
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
          />
        </div>
        {quickResult && (
          <div className="mt-3 max-w-md rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <p className="font-medium">
              {quickResult.title} <span className="font-mono text-xs text-emerald-600">({quickResult.barcode})</span>
            </p>
            <p className="mt-0.5 text-xs">
              {quickResult.fineAmount
                ? `${vi.loan.fineGenerated}: ${quickResult.fineAmount.toLocaleString("vi-VN")}đ`
                : vi.loan.returnNoFine}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">{vi.loan.batchReturnHeading}</h2>
        <div className="mt-4">
          <PatronPicker
            patron={patron}
            onResolved={(p) => {
              setPatron(p);
              setSelectedIds([]);
              setBatchResults(null);
            }}
            onClear={handleClearPatron}
            onError={setError}
          />
        </div>

        {patron && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {activeLoans.length === 0 ? (
              <p className="text-sm text-slate-400">{vi.loan.noBooksToReturn}</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">
                    {vi.nav.loans} ({activeLoans.length})
                  </p>
                  <div className="flex gap-3 text-xs font-medium text-slate-500">
                    <button onClick={() => setSelectedIds(activeLoans.map((l) => l.id))} className="hover:underline">
                      {vi.loan.returnSelectAll}
                    </button>
                    <button onClick={() => setSelectedIds([])} className="hover:underline">
                      {vi.loan.returnDeselectAll}
                    </button>
                  </div>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {activeLoans.map((loan) => {
                    const checked = selectedIds.includes(loan.id);
                    return (
                      <li key={loan.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100">
                          {checked ? (
                            <CheckSquare className="h-4 w-4 shrink-0 text-[#0f1c3a]" strokeWidth={1.75} />
                          ) : (
                            <Square className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                          )}
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelected(loan.id)}
                            className="hidden"
                          />
                          <span className="flex-1">
                            {loan.book.title}{" "}
                            <span className="font-mono text-[10px] text-slate-400">({loan.copy.barcode})</span>
                          </span>
                          <span className={loan.status === "OVERDUE" ? "text-xs font-semibold text-red-600" : "text-xs text-slate-500"}>
                            {vi.loanStatus[loan.status]} · {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  icon={Undo2}
                  className="mt-4"
                  onClick={handleConfirmReturnCart}
                  disabled={batchBusy || selectedIds.length === 0}
                >
                  {vi.loan.returnCartConfirm} {selectedIds.length > 0 && `(${selectedIds.length})`}
                </Button>
              </>
            )}

            {batchResults && (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">{vi.loan.returnResultTitle}</p>
                <ul className="mt-1.5 space-y-1">
                  {batchResults.map((r) => (
                    <li key={r.loanId} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">
                        {r.title} <span className="font-mono text-slate-400">({r.barcode})</span>
                      </span>
                      <span className={r.error ? "font-medium text-red-600" : r.fineAmount ? "font-medium text-red-600" : "text-emerald-700"}>
                        {r.error
                          ? r.error
                          : r.fineAmount
                            ? `${vi.loan.fineGenerated}: ${r.fineAmount.toLocaleString("vi-VN")}đ`
                            : vi.loan.returnNoFine}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveLoansPanel({ defaultLoanPeriodDays }: { defaultLoanPeriodDays: number }) {
  const [activeLoanSearch, setActiveLoanSearch] = useState("");
  const [renewingLoanId, setRenewingLoanId] = useState<string | null>(null);
  const [renewDate, setRenewDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportInfo, setExportInfo] = useState<string | null>(null);

  const returnLoan = useReturnLoan();
  const renewLoan = useRenewLoan();
  const { data: activeLoans, isLoading: loadingActive } = useLoans({
    status: "ACTIVE",
    search: activeLoanSearch || undefined,
    page: 1,
    pageSize: 100,
  });

  async function handleExport() {
    setError(null);
    setExportInfo(null);
    setExporting(true);
    try {
      const blob = await loansApi.exportActiveLoans(activeLoanSearch || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "danh-sach-dang-muon.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportInfo(vi.loan.exportSuccess);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    } finally {
      setExporting(false);
    }
  }

  async function handleReturn(id: string) {
    setError(null);
    if (!confirm(vi.loan.confirmReturn)) return;
    try {
      await returnLoan.mutateAsync(id);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function openRenew(loanId: string, currentDueDate: string) {
    setError(null);
    setRenewingLoanId(loanId);
    const suggested = new Date(currentDueDate);
    suggested.setDate(suggested.getDate() + defaultLoanPeriodDays);
    setRenewDate(toDateInputValue(suggested));
  }

  function cancelRenew() {
    setRenewingLoanId(null);
    setRenewDate("");
  }

  async function handleConfirmRenew(id: string) {
    setError(null);
    try {
      await renewLoan.mutateAsync({ id, input: { newDueDate: renewDate } });
      setRenewingLoanId(null);
      setRenewDate("");
    } catch (err) {
      setError(extractMessage(err, vi.loan.renewBlocked));
    }
  }

  return (
    <div className="mt-4">
      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {exportInfo && (
        <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{exportInfo}</p>
      )}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-800">{vi.nav.loans}</h2>
        <div className="flex items-center gap-3">
          <input
            value={activeLoanSearch}
            onChange={(e) => setActiveLoanSearch(e.target.value)}
            placeholder={vi.loan.searchActivePlaceholder}
            className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <Button icon={Download} variant="secondary" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? vi.common.loading : vi.loan.exportExcel}
          </Button>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
            <tr>
              <th className="px-4 py-2">{vi.common.stt}</th>
              <th className="px-4 py-2">{vi.book.title}</th>
              <th className="px-4 py-2">{vi.copy.barcode}</th>
              <th className="px-4 py-2">{vi.patron.title}</th>
              <th className="px-4 py-2">{vi.loan.dueDate}</th>
              <th className="px-4 py-2">{vi.copy.status}</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loadingActive && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                  {vi.common.loading}
                </td>
              </tr>
            )}
            {!loadingActive && activeLoans?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                  {activeLoanSearch ? vi.loan.noSearchResults : vi.loan.noActiveLoans}
                </td>
              </tr>
            )}
            {activeLoans?.items.map((loan, index) => (
              <tr key={loan.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                <td className="px-4 py-2 text-slate-800">{loan.book.title}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{loan.copy.barcode}</td>
                <td className="px-4 py-2 text-slate-600">{loan.patron.fullName}</td>
                <td className="px-4 py-2 text-slate-600">{new Date(loan.dueDate).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      loan.status === "OVERDUE" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {vi.loanStatus[loan.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  {renewingLoanId === loan.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="date"
                        value={renewDate}
                        min={toDateInputValue(new Date(new Date(loan.dueDate).getTime() + 24 * 60 * 60 * 1000))}
                        onChange={(e) => setRenewDate(e.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
                      />
                      <Button
                        icon={Check}
                        size="sm"
                        onClick={() => handleConfirmRenew(loan.id)}
                        disabled={renewLoan.isPending || !renewDate}
                      >
                        {vi.common.confirm}
                      </Button>
                      <Button icon={X} variant="ghost" size="sm" onClick={cancelRenew}>
                        {vi.common.cancel}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button
                        icon={CalendarClock}
                        variant="ghost"
                        size="sm"
                        onClick={() => openRenew(loan.id, loan.dueDate)}
                        disabled={loan.status === "OVERDUE"}
                      >
                        {vi.loan.renew}
                      </Button>
                      <Button icon={Undo2} size="sm" onClick={() => handleReturn(loan.id)} disabled={returnLoan.isPending}>
                        {vi.loan.returnBook}
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

export default function MuonTraPage() {
  const [tab, setTab] = useState<Tab>("borrow");
  const { data: patronTypes } = usePatronTypes();
  const defaultLoanPeriodDays = patronTypes?.find((t) => t.isDefault)?.loanPeriodDays ?? 14;

  const tabs: { key: Tab; label: string; icon: typeof BookUp }[] = [
    { key: "borrow", label: vi.loan.tabBorrow, icon: BookUp },
    { key: "return", label: vi.loan.tabReturn, icon: Undo2 },
    { key: "active", label: vi.loan.tabActive, icon: ClipboardList },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800">{vi.loan.title}</h1>

      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "border-[#c9a24b] text-[#0f1c3a]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {tab === "borrow" && <BorrowPanel />}
      {tab === "return" && <ReturnPanel />}
      {tab === "active" && <ActiveLoansPanel defaultLoanPeriodDays={defaultLoanPeriodDays} />}
    </div>
  );
}
