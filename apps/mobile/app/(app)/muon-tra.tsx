import { useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { ApiError, vi, type Patron } from "@thuvien/shared";
import { patronsApi, copiesApi } from "../../lib/resources";
import { resolveAssetUrl } from "../../lib/asset-url";
import { colors } from "../../lib/theme";
import { usePatronLoans, usePatrons } from "../../hooks/use-patrons";
import { usePatronTypes } from "../../hooks/use-patron-types";
import { useBook, useBooks } from "../../hooks/use-books";
import { useCreateLoansBatch, useLoans, useRenewLoan, useReturnByBarcode, useReturnLoan } from "../../hooks/use-loans";
import { useFines } from "../../hooks/use-fines";
import { BarcodeScannerModal } from "../../components/barcode-scanner-modal";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Segmented } from "../../components/ui/Segmented";

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | null;
    return body?.message ?? fallback;
  }
  return fallback;
}

function inputStyle(extra?: object) {
  return {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#ffffff",
    fontSize: 14,
    ...extra,
  };
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <Text
      style={{
        color: colors.dangerText,
        backgroundColor: colors.dangerBg,
        padding: 10,
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      {message}
    </Text>
  );
}

function InfoBanner({ message }: { message: string }) {
  return (
    <Text
      style={{
        color: colors.successText,
        backgroundColor: colors.successBg,
        padding: 10,
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      {message}
    </Text>
  );
}

interface CartItem {
  copyId: string;
  barcode: string;
  title: string;
}

function PatronPicker({
  patron,
  onResolved,
  onClear,
  onError,
}: {
  patron: Patron | null;
  onResolved: (patron: Patron) => void;
  onClear: () => void;
  onError: (message: string) => void;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: patrons } = usePatrons({ search: search || undefined, page: 1, pageSize: 10 });

  async function handleScanned(code: string) {
    setScannerOpen(false);
    try {
      const found = await patronsApi.getByCode(code);
      onResolved(found);
      setSearch("");
    } catch (err) {
      onError(extractMessage(err, vi.loan.scanPatronNotFound));
    }
  }

  if (patron) {
    return (
      <Card style={{ backgroundColor: colors.successBg, borderColor: colors.successBorder }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            {patron.avatarUrl ? (
              <Image
                source={{ uri: resolveAssetUrl(patron.avatarUrl) ?? undefined }}
                style={{ width: 40, height: 60, borderRadius: 6, backgroundColor: "#ffffff" }}
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 60,
                  borderRadius: 6,
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "700", color: colors.success }}>
                  {patron.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.successText }}>{patron.fullName}</Text>
              <Text style={{ fontSize: 11, color: colors.success }}>
                {patron.studentCode}
                {patron.className ? ` · ${patron.className}` : ""}
              </Text>
            </View>
          </View>
          <Pressable onPress={onClear}>
            <Text style={{ fontSize: 12, color: colors.success, fontWeight: "700" }}>{vi.loan.cartChangePatron}</Text>
          </Pressable>
        </View>
      </Card>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Button icon="camera-outline" variant="secondary" onPress={() => setScannerOpen(true)}>
        {vi.loan.scanPatronCard}
      </Button>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={vi.patron.searchPlaceholder}
        style={inputStyle()}
      />
      {search && (
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden" }}>
          {patrons?.items.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => {
                onResolved(p);
                setSearch("");
              }}
              style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Text style={{ fontSize: 13 }}>
                <Text style={{ fontFamily: "monospace", color: colors.textMuted }}>{p.studentCode}</Text> —{" "}
                {p.fullName}
              </Text>
            </Pressable>
          ))}
          {patrons?.items.length === 0 && (
            <Text style={{ padding: 10, fontSize: 13, color: colors.textMuted }}>{vi.patron.noResults}</Text>
          )}
        </View>
      )}
      <BarcodeScannerModal
        visible={scannerOpen}
        title={vi.loan.scanPatronCard}
        onScanned={handleScanned}
        onClose={() => setScannerOpen(false)}
      />
    </View>
  );
}

function BorrowPanel() {
  const [patron, setPatron] = useState<Patron | null>(null);
  const [bookSearch, setBookSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

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

  async function handleScannedBook(barcode: string) {
    setScannerOpen(false);
    setError(null);
    if (!patron) {
      setError(vi.loan.cartSelectPatronFirst);
      return;
    }
    try {
      const copy = await copiesApi.getByBarcode(barcode);
      if (copy.status !== "AVAILABLE") {
        setError(vi.loan.scanCopyNotAvailable);
        return;
      }
      addToCart({ copyId: copy.id, barcode: copy.barcode, title: copy.book.title });
    } catch (err) {
      setError(extractMessage(err, vi.loan.scanCopyNotFound));
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
    <View style={{ gap: 12 }}>
      {error && <ErrorBanner message={error} />}
      {info && <InfoBanner message={info} />}

      <Card style={{ gap: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.loan.step1SelectPatron}</Text>
        <PatronPicker
          patron={patron}
          onResolved={(p) => {
            setPatron(p);
            setCart([]);
            setError(null);
          }}
          onClear={handleClearPatron}
          onError={setError}
        />
        {patron && (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 10 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary }}>
                {vi.nav.loans} ({activeLoans.length})
              </Text>
              {activeLoans.length === 0 ? (
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{vi.loan.noActiveLoans}</Text>
              ) : (
                activeLoans.map((loan) => (
                  <View key={loan.id} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 3 }}>
                    <Text style={{ fontSize: 12, color: colors.textPrimary, flex: 1 }}>
                      {loan.book.title} <Text style={{ color: colors.textMuted }}>({loan.copy.barcode})</Text>
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: loan.status === "OVERDUE" ? "700" : "400",
                        color: loan.status === "OVERDUE" ? colors.danger : colors.textMuted,
                      }}
                    >
                      {vi.loanStatus[loan.status]} · {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                ))
              )}
            </View>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary }}>{vi.fine.title}</Text>
              {unpaidFines.length === 0 ? (
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{vi.fine.noFines}</Text>
              ) : (
                <>
                  {unpaidFines.map((fine) => (
                    <View key={fine.id} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 3 }}>
                      <Text style={{ fontSize: 12, color: colors.dangerText, flex: 1 }}>{fine.reason}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.dangerText }}>
                        {fine.amount.toLocaleString("vi-VN")}đ
                      </Text>
                    </View>
                  ))}
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.dangerText, marginTop: 3 }}>
                    {vi.report.unpaidFines}: {totalUnpaid.toLocaleString("vi-VN")}đ
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.loan.step2SelectBooks}</Text>
        <Button icon="camera-outline" variant="secondary" onPress={() => setScannerOpen(true)} disabled={!patron}>
          {vi.loan.scanBookCode}
        </Button>
        <TextInput
          value={bookId ? books?.items.find((b) => b.id === bookId)?.title ?? "" : bookSearch}
          onChangeText={(v) => {
            setBookId("");
            setCopyId("");
            setBookSearch(v);
          }}
          placeholder={vi.book.searchPlaceholder}
          editable={Boolean(patron)}
          style={inputStyle({ opacity: patron ? 1 : 0.5 })}
        />
        {bookSearch && !bookId && (
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden" }}>
            {books?.items.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => setBookId(b.id)}
                style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}
              >
                <Text style={{ fontSize: 13 }}>
                  {b.title} <Text style={{ color: colors.textMuted }}>({b.availableCopies} {vi.book.availability})</Text>
                </Text>
              </Pressable>
            ))}
            {books?.items.length === 0 && (
              <Text style={{ padding: 10, fontSize: 13, color: colors.textMuted }}>{vi.book.noResults}</Text>
            )}
          </View>
        )}
        {bookId && selectedBook && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {selectedBook.copies
              .filter((c) => c.status === "AVAILABLE")
              .map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCopyId(c.id)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: copyId === c.id ? colors.navy : "#e2e8f0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: copyId === c.id ? "#ffffff" : colors.textPrimary }}>
                    {c.barcode}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}
        {bookId && (
          <Button icon="add" variant="secondary" size="sm" onPress={handleAddSelectedToCart} disabled={!copyId}>
            {vi.loan.cartAdd}
          </Button>
        )}
        <BarcodeScannerModal
          visible={scannerOpen}
          title={vi.loan.scanBookCode}
          onScanned={handleScannedBook}
          onClose={() => setScannerOpen(false)}
        />
      </Card>

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="bag-handle-outline" size={16} color={colors.gold} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>
            {vi.loan.step3ConfirmCart} {cart.length > 0 && `(${cart.length})`}
          </Text>
        </View>
        {cart.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted }}>{vi.loan.cartEmpty}</Text>
        ) : (
          <View style={{ gap: 6 }}>
            {cart.map((item) => (
              <View
                key={item.copyId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textPrimary, flex: 1 }}>
                  {item.title} <Text style={{ color: colors.textMuted }}>({item.barcode})</Text>
                </Text>
                <Pressable onPress={() => removeFromCart(item.copyId)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <Button
          icon="checkmark-circle-outline"
          onPress={handleConfirmCart}
          disabled={createLoansBatch.isPending || !patron || cart.length === 0}
        >
          {vi.loan.cartConfirm} {cart.length > 0 && `(${cart.length} ${vi.loan.cartBookCountSuffix})`}
        </Button>
      </Card>
    </View>
  );
}

function ReturnPanel() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickResult, setQuickResult] = useState<{ title: string; barcode: string; fineAmount: number | null } | null>(
    null,
  );

  const [patron, setPatron] = useState<Patron | null>(null);
  const { data: patronLoans } = usePatronLoans(patron?.id);
  const activeLoans = (patronLoans ?? []).filter((l) => l.status !== "RETURNED");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchResults, setBatchResults] = useState<
    { loanId: string; title: string; barcode: string; fineAmount: number | null; error?: string }[] | null
  >(null);
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

  async function handleScanned(barcode: string) {
    setScannerOpen(false);
    setError(null);
    setQuickResult(null);
    try {
      const result = await returnByBarcode.mutateAsync({ barcode });
      setQuickResult({ title: result.book.title, barcode: result.copy.barcode, fineAmount: result.fine?.amount ?? null });
    } catch (err) {
      setError(extractMessage(err, vi.loan.scanNoActiveLoan));
    }
  }

  async function handleConfirmReturnCart() {
    setBatchBusy(true);
    setBatchResults(null);
    const results: { loanId: string; title: string; barcode: string; fineAmount: number | null; error?: string }[] = [];
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
    <View style={{ gap: 12 }}>
      {error && <ErrorBanner message={error} />}

      <Card style={{ gap: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.loan.quickReturnHeading}</Text>
        <Button icon="camera-outline" variant="secondary" onPress={() => setScannerOpen(true)}>
          {vi.loan.scanReturnCode}
        </Button>
        {quickResult && (
          <View style={{ backgroundColor: colors.successBg, borderRadius: 8, padding: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.successText }}>
              {quickResult.title} <Text style={{ fontWeight: "400" }}>({quickResult.barcode})</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.successText, marginTop: 2 }}>
              {quickResult.fineAmount
                ? `${vi.loan.fineGenerated}: ${quickResult.fineAmount.toLocaleString("vi-VN")}đ`
                : vi.loan.returnNoFine}
            </Text>
          </View>
        )}
        <BarcodeScannerModal
          visible={scannerOpen}
          title={vi.loan.scanReturnCode}
          onScanned={handleScanned}
          onClose={() => setScannerOpen(false)}
        />
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>{vi.loan.batchReturnHeading}</Text>
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

        {patron && (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 10 }}>
            {activeLoans.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textMuted }}>{vi.loan.noBooksToReturn}</Text>
            ) : (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary }}>
                    {vi.nav.loans} ({activeLoans.length})
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable onPress={() => setSelectedIds(activeLoans.map((l) => l.id))}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary }}>
                        {vi.loan.returnSelectAll}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setSelectedIds([])}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary }}>
                        {vi.loan.returnDeselectAll}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  {activeLoans.map((loan) => {
                    const checked = selectedIds.includes(loan.id);
                    return (
                      <Pressable
                        key={loan.id}
                        onPress={() => toggleSelected(loan.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          backgroundColor: colors.background,
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <Ionicons
                          name={checked ? "checkbox" : "square-outline"}
                          size={18}
                          color={checked ? colors.navy : colors.textMuted}
                        />
                        <Text style={{ fontSize: 13, color: colors.textPrimary, flex: 1 }}>
                          {loan.book.title} <Text style={{ color: colors.textMuted }}>({loan.copy.barcode})</Text>
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: loan.status === "OVERDUE" ? "700" : "400",
                            color: loan.status === "OVERDUE" ? colors.danger : colors.textMuted,
                          }}
                        >
                          {vi.loanStatus[loan.status]} · {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Button
                  icon="checkmark-done-outline"
                  onPress={handleConfirmReturnCart}
                  disabled={batchBusy || selectedIds.length === 0}
                >
                  {vi.loan.returnCartConfirm} {selectedIds.length > 0 && `(${selectedIds.length})`}
                </Button>
              </>
            )}

            {batchResults && (
              <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 10, gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary }}>
                  {vi.loan.returnResultTitle}
                </Text>
                {batchResults.map((r) => (
                  <View key={r.loanId} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 12, color: colors.textPrimary, flex: 1 }}>
                      {r.title} <Text style={{ color: colors.textMuted }}>({r.barcode})</Text>
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: r.error || r.fineAmount ? colors.danger : colors.success,
                      }}
                    >
                      {r.error
                        ? r.error
                        : r.fineAmount
                          ? `${vi.loan.fineGenerated}: ${r.fineAmount.toLocaleString("vi-VN")}đ`
                          : vi.loan.returnNoFine}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

function ActiveLoansPanel({ defaultLoanPeriodDays }: { defaultLoanPeriodDays: number }) {
  const [activeLoanSearch, setActiveLoanSearch] = useState("");
  const [renewingLoanId, setRenewingLoanId] = useState<string | null>(null);
  const [renewDate, setRenewDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnLoan = useReturnLoan();
  const renewLoan = useRenewLoan();
  const { data: activeLoans, isLoading } = useLoans({
    status: "ACTIVE",
    search: activeLoanSearch || undefined,
    page: 1,
    pageSize: 100,
  });

  function handleReturn(id: string) {
    Alert.alert(vi.loan.confirmReturn, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.loan.returnBook,
        onPress: async () => {
          setError(null);
          try {
            await returnLoan.mutateAsync(id);
          } catch (err) {
            setError(extractMessage(err, vi.common.error));
          }
        },
      },
    ]);
  }

  function openRenew(loanId: string, dueDate: string) {
    setError(null);
    const suggested = new Date(dueDate);
    suggested.setDate(suggested.getDate() + defaultLoanPeriodDays);
    setRenewDate(suggested);
    setRenewingLoanId(loanId);
    setShowPicker(true);
  }

  function cancelRenew() {
    setRenewingLoanId(null);
    setShowPicker(false);
  }

  function handleDateChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (selectedDate) setRenewDate(selectedDate);
  }

  async function handleConfirmRenew(id: string) {
    setError(null);
    try {
      await renewLoan.mutateAsync({ id, input: { newDueDate: renewDate.toISOString().slice(0, 10) } });
      setRenewingLoanId(null);
      setShowPicker(false);
    } catch (err) {
      setError(extractMessage(err, vi.loan.renewBlocked));
    }
  }

  return (
    <View style={{ gap: 10 }}>
      {error && <ErrorBanner message={error} />}
      <TextInput
        value={activeLoanSearch}
        onChangeText={setActiveLoanSearch}
        placeholder={vi.loan.searchActivePlaceholder}
        style={inputStyle()}
      />
      {isLoading && <Text style={{ color: colors.textMuted }}>{vi.common.loading}</Text>}
      {!isLoading && activeLoans?.items.length === 0 && (
        <Text style={{ color: colors.textMuted }}>{activeLoanSearch ? vi.loan.noSearchResults : vi.loan.noActiveLoans}</Text>
      )}
      {activeLoans?.items.map((loan) => (
        <Card key={loan.id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "700", color: colors.textPrimary, flex: 1 }}>{loan.book.title}</Text>
            <Badge tone={loan.status === "OVERDUE" ? "danger" : "success"}>{vi.loanStatus[loan.status]}</Badge>
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            {vi.copy.barcode}: {loan.copy.barcode}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{loan.patron.fullName}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            {vi.loan.dueDate}: {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
          </Text>
          {renewingLoanId === loan.id ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              {(showPicker || Platform.OS === "ios") && (
                <DateTimePicker
                  value={renewDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "compact" : "default"}
                  minimumDate={new Date(new Date(loan.dueDate).getTime() + 24 * 60 * 60 * 1000)}
                  onChange={handleDateChange}
                />
              )}
              <Pressable onPress={() => handleConfirmRenew(loan.id)}>
                <Text style={{ color: colors.navy, fontWeight: "700", fontSize: 13 }}>{vi.common.confirm}</Text>
              </Pressable>
              <Pressable onPress={cancelRenew}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>{vi.common.cancel}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 8 }}>
              <Pressable onPress={() => openRenew(loan.id, loan.dueDate)} disabled={loan.status === "OVERDUE"}>
                <Text style={{ color: loan.status === "OVERDUE" ? colors.border : colors.textSecondary, fontSize: 13 }}>
                  {vi.loan.renew}
                </Text>
              </Pressable>
              <Pressable onPress={() => handleReturn(loan.id)}>
                <Text style={{ color: colors.navy, fontWeight: "700", fontSize: 13 }}>{vi.loan.returnBook}</Text>
              </Pressable>
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}

type Tab = "borrow" | "return" | "active";

export default function MuonTraScreen() {
  const [tab, setTab] = useState<Tab>("borrow");
  const { data: patronTypes } = usePatronTypes();
  const defaultLoanPeriodDays = patronTypes?.find((t) => t.isDefault)?.loanPeriodDays ?? 14;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: "borrow", label: vi.loan.tabBorrow, icon: "book-outline" },
          { key: "return", label: vi.loan.tabReturn, icon: "checkmark-done-outline" },
          { key: "active", label: vi.loan.tabActive, icon: "time-outline" },
        ]}
      />
      {tab === "borrow" && <BorrowPanel />}
      {tab === "return" && <ReturnPanel />}
      {tab === "active" && <ActiveLoansPanel defaultLoanPeriodDays={defaultLoanPeriodDays} />}
    </ScrollView>
  );
}
