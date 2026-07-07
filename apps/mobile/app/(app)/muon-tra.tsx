import { useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { ApiError, vi, type Patron } from "@thuvien/shared";
import { patronsApi, copiesApi } from "../../lib/resources";
import { resolveAssetUrl } from "../../lib/asset-url";
import { usePatronLoans, usePatrons } from "../../hooks/use-patrons";
import { usePatronTypes } from "../../hooks/use-patron-types";
import { useBook, useBooks } from "../../hooks/use-books";
import { useCreateLoansBatch, useLoans, useRenewLoan, useReturnByBarcode, useReturnLoan } from "../../hooks/use-loans";
import { useFines } from "../../hooks/use-fines";
import { BarcodeScannerModal } from "../../components/barcode-scanner-modal";

type ScanTarget = "patron" | "borrow" | "return" | null;

interface CartItem {
  copyId: string;
  barcode: string;
  title: string;
}

export default function MuonTraScreen() {
  const [patronSearch, setPatronSearch] = useState("");
  const [patronId, setPatronId] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [bookId, setBookId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [renewingLoanId, setRenewingLoanId] = useState<string | null>(null);
  const [renewDate, setRenewDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [scannedPatron, setScannedPatron] = useState<Patron | null>(null);
  const [scanTarget, setScanTarget] = useState<ScanTarget>(null);
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

  async function handleBarcodeScanned(data: string) {
    const target = scanTarget;
    setScanTarget(null);
    setError(null);

    if (target === "patron") {
      try {
        const patron = await patronsApi.getByCode(data);
        setScannedPatron(patron);
        setPatronId(patron.id);
        setPatronSearch("");
        setCart([]);
      } catch (err) {
        setError(extractMessage(err, vi.loan.scanPatronNotFound));
      }
      return;
    }

    if (target === "borrow") {
      if (!patronId) {
        setError(vi.loan.cartSelectPatronFirst);
        return;
      }
      try {
        const copy = await copiesApi.getByBarcode(data);
        if (copy.status !== "AVAILABLE") {
          setError(vi.loan.scanCopyNotAvailable);
          return;
        }
        addToCart({ copyId: copy.id, barcode: copy.barcode, title: copy.book.title });
      } catch (err) {
        setError(extractMessage(err, vi.loan.scanCopyNotFound));
      }
      return;
    }

    if (target === "return") {
      try {
        const result = await returnByBarcode.mutateAsync({ barcode: data });
        if (result.fine) {
          Alert.alert(vi.loan.fineGenerated, `${result.fine.amount.toLocaleString("vi-VN")}đ`);
        }
      } catch (err) {
        setError(extractMessage(err, vi.loan.scanNoActiveLoan));
      }
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

  function handleReturn(id: string) {
    Alert.alert(vi.loan.confirmReturn, undefined, [
      { text: vi.common.cancel, style: "cancel" },
      {
        text: vi.loan.returnBook,
        onPress: async () => {
          setError(null);
          try {
            const result = await returnLoan.mutateAsync(id);
            if (result.fine) {
              Alert.alert(vi.loan.fineGenerated, `${result.fine.amount.toLocaleString("vi-VN")}đ`);
            }
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
    <>
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.loan.title}</Text>

      {error && (
        <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12 }}>
          {error}
        </Text>
      )}
      {info && (
        <Text style={{ color: "#047857", backgroundColor: "#ecfdf5", padding: 10, borderRadius: 8, marginTop: 12 }}>
          {info}
        </Text>
      )}

      <View style={{ marginTop: 14, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14 }}>
        <Text style={{ fontWeight: "600", color: "#1e293b", marginBottom: 10 }}>Quét mã nhanh</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Pressable
            onPress={() => setScanTarget("patron")}
            style={{ backgroundColor: "#0f172a", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>{vi.loan.scanPatronCard}</Text>
          </Pressable>
          <Pressable
            onPress={() => setScanTarget("borrow")}
            style={{ backgroundColor: "#0f172a", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>{vi.loan.scanBookCode}</Text>
          </Pressable>
          <Pressable
            onPress={() => setScanTarget("return")}
            style={{ backgroundColor: "#0f172a", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>{vi.loan.scanReturnCode}</Text>
          </Pressable>
        </View>
        {scannedPatron && (
          <View
            style={{
              marginTop: 10,
              backgroundColor: "#ecfdf5",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                {scannedPatron.avatarUrl ? (
                  <Image
                    source={{ uri: resolveAssetUrl(scannedPatron.avatarUrl) ?? undefined }}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "white" }}
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "white",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: "#047857" }}>
                      {scannedPatron.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#064e3b" }}>{scannedPatron.fullName}</Text>
                  <Text style={{ fontSize: 11, color: "#047857" }}>
                    {scannedPatron.studentCode}
                    {scannedPatron.className ? ` · ${scannedPatron.className}` : ""}
                  </Text>
                </View>
              </View>
              <Pressable onPress={clearScannedPatron}>
                <Text style={{ fontSize: 12, color: "#047857", fontWeight: "600" }}>{vi.loan.cartChangePatron}</Text>
              </Pressable>
            </View>

            <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: "#a7f3d0", paddingTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#064e3b" }}>
                {vi.loan.title} ({activeScannedLoans.length})
              </Text>
              {activeScannedLoans.length === 0 ? (
                <Text style={{ fontSize: 11, color: "#047857", marginTop: 2 }}>{vi.loan.noActiveLoans}</Text>
              ) : (
                activeScannedLoans.map((loan) => (
                  <View
                    key={loan.id}
                    style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}
                  >
                    <Text style={{ fontSize: 11, color: "#065f46", flex: 1 }}>{loan.book.title}</Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: loan.status === "OVERDUE" ? "700" : "400",
                        color: loan.status === "OVERDUE" ? "#dc2626" : "#047857",
                      }}
                    >
                      {vi.loanStatus[loan.status]} · {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: "#a7f3d0", paddingTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#064e3b" }}>{vi.fine.title}</Text>
              {unpaidScannedFines.length === 0 ? (
                <Text style={{ fontSize: 11, color: "#047857", marginTop: 2 }}>{vi.fine.noFines}</Text>
              ) : (
                <>
                  {unpaidScannedFines.map((fine) => (
                    <View
                      key={fine.id}
                      style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}
                    >
                      <Text style={{ fontSize: 11, color: "#b91c1c", flex: 1 }}>{fine.reason}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#b91c1c" }}>
                        {fine.amount.toLocaleString("vi-VN")}đ
                      </Text>
                    </View>
                  ))}
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#b91c1c", marginTop: 4 }}>
                    {vi.report.unpaidFines}: {totalUnpaidScanned.toLocaleString("vi-VN")}đ
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={{ marginTop: 14, backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14 }}>
        <Text style={{ fontWeight: "600", color: "#1e293b", marginBottom: 10 }}>{vi.loan.borrow}</Text>

        <Text style={{ fontSize: 12, color: "#334155", marginBottom: 4 }}>{vi.loan.selectPatron}</Text>
        <TextInput
          value={
            patronId
              ? (scannedPatron?.fullName ?? patrons?.items.find((p) => p.id === patronId)?.fullName ?? "")
              : patronSearch
          }
          onChangeText={(v) => {
            setPatronId("");
            setScannedPatron(null);
            setCart([]);
            setPatronSearch(v);
          }}
          placeholder={vi.patron.searchPlaceholder}
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
        />
        {patronSearch && !patronId && (
          <View style={{ marginTop: 4, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8 }}>
            {patrons?.items.map((p) => (
              <Pressable key={p.id} onPress={() => setPatronId(p.id)} style={{ padding: 10 }}>
                <Text style={{ fontSize: 13 }}>
                  {p.studentCode} — {p.fullName}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {patronId && (
          <Pressable
            onPress={() => {
              setPatronId("");
              setPatronSearch("");
              setScannedPatron(null);
              setCart([]);
            }}
            style={{ marginTop: 4 }}
          >
            <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "600" }}>{vi.loan.cartChangePatron}</Text>
          </Pressable>
        )}

        <Text style={{ fontSize: 12, color: "#334155", marginTop: 12, marginBottom: 4 }}>{vi.loan.selectCopy}</Text>
        <TextInput
          value={bookId ? books?.items.find((b) => b.id === bookId)?.title ?? "" : bookSearch}
          onChangeText={(v) => {
            setBookId("");
            setCopyId("");
            setBookSearch(v);
          }}
          placeholder={vi.book.searchPlaceholder}
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
        />
        {bookSearch && !bookId && (
          <View style={{ marginTop: 4, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8 }}>
            {books?.items.map((b) => (
              <Pressable key={b.id} onPress={() => setBookId(b.id)} style={{ padding: 10 }}>
                <Text style={{ fontSize: 13 }}>
                  {b.title} ({b.availableCopies} {vi.book.availability})
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {bookId && selectedBook && (
          <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
                    backgroundColor: copyId === c.id ? "#0f172a" : "#e2e8f0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: copyId === c.id ? "white" : "#334155" }}>{c.barcode}</Text>
                </Pressable>
              ))}
          </View>
        )}

        <Pressable
          onPress={handleAddSelectedToCart}
          disabled={!patronId || !copyId}
          style={{
            backgroundColor: "#e2e8f0",
            padding: 10,
            borderRadius: 8,
            marginTop: 12,
            opacity: !patronId || !copyId ? 0.5 : 1,
          }}
        >
          <Text style={{ color: "#1e293b", textAlign: "center", fontWeight: "600", fontSize: 13 }}>
            {vi.loan.cartAdd}
          </Text>
        </Pressable>

        <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b" }}>
            {vi.loan.cart} {cart.length > 0 && `(${cart.length})`}
          </Text>
          {cart.length === 0 ? (
            <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{vi.loan.cartEmpty}</Text>
          ) : (
            <View style={{ marginTop: 6, gap: 6 }}>
              {cart.map((item) => (
                <View
                  key={item.copyId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#f8fafc",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#334155", flex: 1 }}>
                    {item.title} <Text style={{ color: "#94a3b8" }}>({item.barcode})</Text>
                  </Text>
                  <Pressable onPress={() => removeFromCart(item.copyId)}>
                    <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>{vi.loan.cartRemove}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={handleConfirmCart}
            disabled={!patronId || cart.length === 0 || createLoansBatch.isPending}
            style={{
              backgroundColor: "#0f172a",
              padding: 12,
              borderRadius: 8,
              marginTop: 12,
              opacity: !patronId || cart.length === 0 ? 0.5 : 1,
            }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
              {vi.loan.cartConfirm} {cart.length > 0 && `(${cart.length} ${vi.loan.cartBookCountSuffix})`}
            </Text>
          </Pressable>
        </View>
      </View>

      <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginTop: 20, marginBottom: 10 }}>
        {vi.nav.loans}
      </Text>
      <TextInput
        value={activeLoanSearch}
        onChangeText={setActiveLoanSearch}
        placeholder={vi.loan.searchActivePlaceholder}
        style={{
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 8,
          padding: 10,
          backgroundColor: "white",
          marginBottom: 10,
        }}
      />
      {loadingActive && <Text style={{ color: "#94a3b8" }}>{vi.common.loading}</Text>}
      {!loadingActive && activeLoans?.items.length === 0 && (
        <Text style={{ color: "#94a3b8" }}>
          {activeLoanSearch ? vi.loan.noSearchResults : vi.loan.noActiveLoans}
        </Text>
      )}
      {activeLoans?.items.map((loan, index) => (
        <View
          key={loan.id}
          style={{
            borderWidth: 1,
            borderColor: "#e2e8f0",
            borderRadius: 10,
            padding: 12,
            marginBottom: 8,
            backgroundColor: "white",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "600", color: "#1e293b", flex: 1 }}>
              <Text style={{ color: "#94a3b8" }}>{index + 1}. </Text>
              {loan.book.title}
            </Text>
            <Text
              style={{ fontSize: 11, fontWeight: "600", color: loan.status === "OVERDUE" ? "#dc2626" : "#047857" }}
            >
              {vi.loanStatus[loan.status]}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{loan.patron.fullName}</Text>
          <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
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
                <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13 }}>{vi.common.confirm}</Text>
              </Pressable>
              <Pressable onPress={cancelRenew}>
                <Text style={{ color: "#94a3b8", fontSize: 13 }}>{vi.common.cancel}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 8 }}>
              <Pressable onPress={() => openRenew(loan.id, loan.dueDate)} disabled={loan.status === "OVERDUE"}>
                <Text style={{ color: loan.status === "OVERDUE" ? "#cbd5e1" : "#334155", fontSize: 13 }}>
                  {vi.loan.renew}
                </Text>
              </Pressable>
              <Pressable onPress={() => handleReturn(loan.id)}>
                <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13 }}>{vi.loan.returnBook}</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
    <BarcodeScannerModal
      visible={scanTarget !== null}
      title={
        scanTarget === "patron"
          ? vi.loan.scanPatronCard
          : scanTarget === "borrow"
            ? vi.loan.scanBookCode
            : vi.loan.scanReturnCode
      }
      onScanned={handleBarcodeScanned}
      onClose={() => setScanTarget(null)}
    />
    </>
  );
}
