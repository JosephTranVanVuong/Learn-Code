"use client";

import { useState } from "react";
import { BookUp, CalendarClock, Check, Plus, ShoppingBag, Trash2, Undo2, X } from "lucide-react";
import { ApiError, vi, type Patron } from "@thuvien/shared";
import { patronsApi, copiesApi } from "@/lib/resources";
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

interface CartItem {
  copyId: string;
  barcode: string;
  title: string;
}

export default function MuonTraPage() {
  const [patronSearch, setPatronSearch] = useState("");
  const [patronId, setPatronId] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [renewingLoanId, setRenewingLoanId] = useState<string | null>(null);
  const [renewDate, setRenewDate] = useState("");

  const [scannedPatron, setScannedPatron] = useState<Patron | null>(null);
  const [scanPatronInput, setScanPatronInput] = useState("");
  const [scanBorrowInput, setScanBorrowInput] = useState("");
  const [scanReturnInput, setScanReturnInput] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [activeLoanSearch, setActiveLoanSearch] = useState("");

  const { data: patrons } = usePatrons({ search: patronSearch || undefined, page: 1, pageSize: 10 });
  const { data: patronTypes } = usePatronTypes();
  const defaultLoanPeriodDays = patronTypes?.find((t) => t.isDefault)?.loanPeriodDays ?? 14;
  const { data: books } = useBooks({ search: bookSearch || undefined, availableOnly: true, page: 1, pageSize: 10 });
  const { data: selectedBook } = useBook(bookId || undefined);

  const { data: scannedPatronLoans } = usePatronLoans(scannedPatron?.id);
  const { data: scannedPatronFines } = useFines(
    { patronId: scannedPatron?.id, status: "UNPAID", page: 1, pageSize: 20 },
    { enabled: Boolean(scannedPatron) },
  );
  const activeScannedLoans = (scannedPatronLoans ?? []).filter((l) => l.status !== "RETURNED");
  const unpaidScannedFines = scannedPatronFines?.items ?? [];
  const totalUnpaidScanned = unpaidScannedFines.reduce((sum, f) => sum + f.amount, 0);

  const createLoansBatch = useCreateLoansBatch();
  const returnLoan = useReturnLoan();
  const renewLoan = useRenewLoan();
  const returnByBarcode = useReturnByBarcode();

  const { data: activeLoans, isLoading: loadingActive } = useLoans({
    status: "ACTIVE",
    search: activeLoanSearch || undefined,
    page: 1,
    pageSize: 100,
  });

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  function clearScannedPatron() {
    setScannedPatron(null);
    setPatronId("");
    setPatronSearch("");
    setCart([]);
  }

  function addToCart(item: CartItem) {
    setError(null);
    if (!patronId) {
      setError(vi.loan.cartSelectPatronFirst);
      return;
    }
    if (cart.some((c) => c.copyId === item.copyId)) {
      setError(vi.loan.cartAlreadyIn);
      return;
    }
    setCart((c) => [...c, item]);
  }

  function removeFromCart(copyId: string) {
    setCart((c) => c.filter((item) => item.copyId !== copyId));
  }

  async function handleScanPatron(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = scanPatronInput.trim();
    setScanPatronInput("");
    if (!code) return;
    setError(null);
    setScanBusy(true);
    try {
      const patron = await patronsApi.getByCode(code);
      setScannedPatron(patron);
      setPatronId(patron.id);
      setPatronSearch("");
      setCart([]);
    } catch (err) {
      setError(extractMessage(err, vi.loan.scanPatronNotFound));
    } finally {
      setScanBusy(false);
    }
  }

  async function handleScanBorrow(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const barcode = scanBorrowInput.trim();
    setScanBorrowInput("");
    if (!barcode) return;
    setError(null);
    if (!patronId) {
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

  async function handleScanReturn(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const barcode = scanReturnInput.trim();
    setScanReturnInput("");
    if (!barcode) return;
    setError(null);
    setScanBusy(true);
    try {
      const result = await returnByBarcode.mutateAsync({ barcode });
      if (result.fine) {
        alert(`${vi.loan.fineGenerated}: ${result.fine.amount.toLocaleString("vi-VN")}đ`);
      }
    } catch (err) {
      setError(extractMessage(err, vi.loan.scanNoActiveLoan));
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
    if (!patronId || cart.length === 0) return;
    try {
      const result = await createLoansBatch.mutateAsync({ patronId, copyIds: cart.map((c) => c.copyId) });
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

  async function handleReturn(id: string) {
    setError(null);
    if (!confirm(vi.loan.confirmReturn)) return;
    try {
      const result = await returnLoan.mutateAsync(id);
      if (result.fine) {
        alert(`${vi.loan.fineGenerated}: ${result.fine.amount.toLocaleString("vi-VN")}đ`);
      }
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

  const selectedPatronName = scannedPatron?.fullName ?? patrons?.items.find((p) => p.id === patronId)?.fullName;

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800">{vi.loan.title}</h1>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-800">Quét mã nhanh</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.loan.scanPatronCard}</label>
            <input
              value={scanPatronInput}
              onChange={(e) => setScanPatronInput(e.target.value)}
              onKeyDown={handleScanPatron}
              placeholder={vi.loan.scanPlaceholder}
              disabled={scanBusy}
              autoFocus
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
            />
            {scannedPatron && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                <span>{vi.loan.scanPatronFound}</span>
                <button onClick={clearScannedPatron} className="ml-2 flex items-center gap-1 font-medium hover:underline">
                  <X className="h-3 w-3" strokeWidth={2} />
                  {vi.loan.cartChangePatron}
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.loan.scanBookCode}</label>
            <input
              value={scanBorrowInput}
              onChange={(e) => setScanBorrowInput(e.target.value)}
              onKeyDown={handleScanBorrow}
              placeholder={vi.loan.scanPlaceholder}
              disabled={scanBusy}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.loan.scanReturnCode}</label>
            <input
              value={scanReturnInput}
              onChange={(e) => setScanReturnInput(e.target.value)}
              onKeyDown={handleScanReturn}
              placeholder={vi.loan.scanPlaceholder}
              disabled={scanBusy}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        {scannedPatron && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {scannedPatron.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveAssetUrl(scannedPatron.avatarUrl) ?? undefined}
                    alt={scannedPatron.fullName}
                    className="h-12 w-12 rounded-full border border-emerald-200 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-white text-sm font-semibold text-emerald-700">
                    {scannedPatron.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{scannedPatron.fullName}</p>
                  <p className="text-xs text-emerald-700">
                    {scannedPatron.studentCode}
                    {scannedPatron.className ? ` · ${scannedPatron.className}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={clearScannedPatron}
                className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
              >
                <X className="h-3 w-3" strokeWidth={2} />
                {vi.loan.cartChangePatron}
              </button>
            </div>

            <div className="mt-3 border-t border-emerald-200 pt-3">
              <p className="text-xs font-semibold text-emerald-900">
                {vi.loan.title} ({activeScannedLoans.length})
              </p>
              {activeScannedLoans.length === 0 ? (
                <p className="mt-1 text-xs text-emerald-700">{vi.loan.noActiveLoans}</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {activeScannedLoans.map((loan) => (
                    <li key={loan.id} className="flex items-center justify-between text-xs text-emerald-800">
                      <span>{loan.book.title}</span>
                      <span className={loan.status === "OVERDUE" ? "font-semibold text-red-600" : ""}>
                        {vi.loanStatus[loan.status]} · {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 border-t border-emerald-200 pt-3">
              <p className="text-xs font-semibold text-emerald-900">{vi.fine.title}</p>
              {unpaidScannedFines.length === 0 ? (
                <p className="mt-1 text-xs text-emerald-700">{vi.fine.noFines}</p>
              ) : (
                <>
                  <ul className="mt-1 space-y-1">
                    {unpaidScannedFines.map((fine) => (
                      <li key={fine.id} className="flex items-center justify-between text-xs text-red-700">
                        <span>{fine.reason}</span>
                        <span className="font-semibold">{fine.amount.toLocaleString("vi-VN")}đ</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-xs font-semibold text-red-700">
                    {vi.report.unpaidFines}: {totalUnpaidScanned.toLocaleString("vi-VN")}đ
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">{vi.loan.borrow}</h2>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">{vi.loan.selectPatron}</label>
          <input
            value={patronId ? (selectedPatronName ?? "") : patronSearch}
            onChange={(e) => {
              setPatronId("");
              setScannedPatron(null);
              setCart([]);
              setPatronSearch(e.target.value);
            }}
            placeholder={vi.patron.searchPlaceholder}
            className="mt-1 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          {patronSearch && !patronId && (
            <div className="mt-1 max-h-40 max-w-md overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
              {patrons?.items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPatronId(p.id)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="font-mono text-xs text-slate-500">{p.studentCode}</span> — {p.fullName}
                </button>
              ))}
              {patrons?.items.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">{vi.patron.noResults}</p>
              )}
            </div>
          )}
          {patronId && (
            <button
              onClick={() => {
                setPatronId("");
                setPatronSearch("");
                setScannedPatron(null);
                setCart([]);
              }}
              className="mt-1 text-xs font-medium text-slate-500 hover:underline"
            >
              {vi.loan.cartChangePatron}
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.loan.selectCopy}</label>
            <input
              value={bookId ? books?.items.find((b) => b.id === bookId)?.title ?? "" : bookSearch}
              onChange={(e) => {
                setBookId("");
                setCopyId("");
                setBookSearch(e.target.value);
              }}
              placeholder={vi.book.searchPlaceholder}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            {bookSearch && !bookId && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
                {books?.items.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBookId(b.id)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {b.title} <span className="text-xs text-slate-400">({b.availableCopies} {vi.book.availability})</span>
                  </button>
                ))}
                {books?.items.length === 0 && (
                  <p className="px-3 py-2 text-sm text-slate-400">{vi.book.noResults}</p>
                )}
              </div>
            )}
            {bookId && selectedBook && (
              <select
                value={copyId}
                onChange={(e) => setCopyId(e.target.value)}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
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
            )}
          </div>
          <div className="flex items-end">
            <Button icon={Plus} onClick={handleAddSelectedToCart} disabled={!patronId || !copyId}>
              {vi.loan.cartAdd}
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ShoppingBag className="h-4 w-4 text-[#c9a24b]" strokeWidth={1.75} />
            {vi.loan.cart} {cart.length > 0 && `(${cart.length})`}
          </h3>
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
            disabled={createLoansBatch.isPending || !patronId || cart.length === 0}
          >
            {vi.loan.cartConfirm} {cart.length > 0 && `(${cart.length} ${vi.loan.cartBookCountSuffix})`}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-800">{vi.nav.loans}</h2>
          <input
            value={activeLoanSearch}
            onChange={(e) => setActiveLoanSearch(e.target.value)}
            placeholder={vi.loan.searchActivePlaceholder}
            className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
              <tr>
                <th className="px-4 py-2">{vi.common.stt}</th>
                <th className="px-4 py-2">{vi.book.title}</th>
                <th className="px-4 py-2">{vi.patron.title}</th>
                <th className="px-4 py-2">{vi.loan.dueDate}</th>
                <th className="px-4 py-2">{vi.copy.status}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loadingActive && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                    {vi.common.loading}
                  </td>
                </tr>
              )}
              {!loadingActive && activeLoans?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                    {activeLoanSearch ? vi.loan.noSearchResults : vi.loan.noActiveLoans}
                  </td>
                </tr>
              )}
              {activeLoans?.items.map((loan, index) => (
                <tr key={loan.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                  <td className="px-4 py-2 text-slate-800">{loan.book.title}</td>
                  <td className="px-4 py-2 text-slate-600">{loan.patron.fullName}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                  </td>
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
    </div>
  );
}
