import { useState } from "react";
import { useRouter } from "expo-router";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  ApiError,
  DELETE_ALL_CONFIRMATION_PHRASE,
  DELETE_BOOKS_CONFIRMATION_PHRASE,
  DELETE_CATEGORIES_AUTHORS_CONFIRMATION_PHRASE,
  DELETE_LOANS_FINES_CONFIRMATION_PHRASE,
  DELETE_PATRONS_CONFIRMATION_PHRASE,
  vi,
} from "@thuvien/shared";
import {
  useDeleteAllData,
  useDeleteBooksData,
  useDeleteCategoriesAuthorsData,
  useDeleteDataCounts,
  useDeleteLoansFines,
  useDeletePatronsData,
  useDeletionLogs,
} from "../../../hooks/use-data-management";

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | null;
    return body?.message ?? fallback;
  }
  return fallback;
}

type ActionKey = "loans_fines" | "patrons" | "books" | "categories_authors";

const ACTION_META: Record<ActionKey, { title: string; desc: string; requiredPhrase: string; phraseLabel: string }> = {
  loans_fines: {
    title: vi.settings.deleteLoansFines,
    desc: vi.settings.deleteLoansFinesDesc,
    requiredPhrase: DELETE_LOANS_FINES_CONFIRMATION_PHRASE,
    phraseLabel: vi.settings.deleteLoansFinesConfirmPhraseLabel,
  },
  patrons: {
    title: vi.settings.deletePatronsData,
    desc: vi.settings.deletePatronsDataDesc,
    requiredPhrase: DELETE_PATRONS_CONFIRMATION_PHRASE,
    phraseLabel: vi.settings.deletePatronsConfirmPhraseLabel,
  },
  books: {
    title: vi.settings.deleteBooksData,
    desc: vi.settings.deleteBooksDataDesc,
    requiredPhrase: DELETE_BOOKS_CONFIRMATION_PHRASE,
    phraseLabel: vi.settings.deleteBooksConfirmPhraseLabel,
  },
  categories_authors: {
    title: vi.settings.deleteCategoriesAuthorsData,
    desc: vi.settings.deleteCategoriesAuthorsDesc,
    requiredPhrase: DELETE_CATEGORIES_AUTHORS_CONFIRMATION_PHRASE,
    phraseLabel: vi.settings.deleteCategoriesAuthorsConfirmPhraseLabel,
  },
};

function actionLabel(action: string): string {
  if (action in ACTION_META) return ACTION_META[action as ActionKey].title;
  if (action === "all") return vi.settings.deleteAllData;
  return action;
}

function DeleteCard({
  title,
  desc,
  countsText,
  disabled,
  disabledHint,
  onOpen,
}: {
  title: string;
  desc: string;
  countsText: string;
  disabled?: boolean;
  disabledHint?: string;
  onOpen: () => void;
}) {
  return (
    <View style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, backgroundColor: "white" }}>
      <Text style={{ fontWeight: "600", color: "#1e293b" }}>{title}</Text>
      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{desc}</Text>
      {countsText && !disabled && (
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#b45309", marginTop: 6 }}>
          {vi.settings.willDelete}: {countsText}
        </Text>
      )}
      {disabled && disabledHint && (
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#dc2626", marginTop: 6 }}>{disabledHint}</Text>
      )}
      <Pressable
        onPress={onOpen}
        disabled={disabled}
        style={{ borderWidth: 1, borderColor: "#dc2626", padding: 10, borderRadius: 8, marginTop: 10, opacity: disabled ? 0.5 : 1 }}
      >
        <Text style={{ color: "#dc2626", textAlign: "center", fontWeight: "600", fontSize: 13 }}>{title}</Text>
      </Pressable>
    </View>
  );
}

export default function XoaDuLieuScreen() {
  const router = useRouter();
  const { data: counts } = useDeleteDataCounts();
  const { data: logs } = useDeletionLogs();

  const deleteLoansFines = useDeleteLoansFines();
  const deletePatrons = useDeletePatronsData();
  const deleteBooks = useDeleteBooksData();
  const deleteCategoriesAuthors = useDeleteCategoriesAuthorsData();
  const deleteAll = useDeleteAllData();

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);
  const [modalPhrase, setModalPhrase] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [password, setPassword] = useState("");

  const categoriesBlocked = (counts?.books ?? 0) > 0;
  const modalPending =
    deleteLoansFines.isPending || deletePatrons.isPending || deleteBooks.isPending || deleteCategoriesAuthors.isPending;

  function openModal(action: ActionKey) {
    setError(null);
    setInfo(null);
    setActiveAction(action);
    setModalPhrase("");
    setModalPassword("");
    setModalError(null);
  }

  function closeModal() {
    if (modalPending) return;
    setActiveAction(null);
    setModalPhrase("");
    setModalPassword("");
    setModalError(null);
  }

  async function handleModalConfirm() {
    if (!activeAction) return;
    const meta = ACTION_META[activeAction];
    setModalError(null);
    if (modalPhrase.trim() !== meta.requiredPhrase) {
      setModalError(`Vui lòng gõ đúng "${meta.requiredPhrase}"`);
      return;
    }
    const input = { confirmationPhrase: modalPhrase.trim(), password: modalPassword };
    try {
      if (activeAction === "loans_fines") {
        const result = await deleteLoansFines.mutateAsync(input);
        setInfo(`${result.deletedLoans} ${vi.settings.deleteResultLoans}, ${result.deletedFines} ${vi.settings.deleteResultFines}`);
      } else if (activeAction === "patrons") {
        const result = await deletePatrons.mutateAsync(input);
        setInfo(`${result.deletedPatrons} ${vi.settings.deleteResultPatrons}`);
      } else if (activeAction === "books") {
        const result = await deleteBooks.mutateAsync(input);
        setInfo(`${result.deletedBooks} ${vi.settings.deleteResultBooks}`);
      } else if (activeAction === "categories_authors") {
        const result = await deleteCategoriesAuthors.mutateAsync(input);
        setInfo(
          `${result.deletedCategories} ${vi.settings.deleteResultCategories}, ${result.deletedAuthors} ${vi.settings.deleteResultAuthors}`,
        );
      }
      setActiveAction(null);
      setModalPhrase("");
      setModalPassword("");
    } catch (err) {
      setModalError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeleteAll() {
    setError(null);
    setInfo(null);
    try {
      const result = await deleteAll.mutateAsync({ confirmationPhrase: confirmPhrase, password });
      setConfirmPhrase("");
      setPassword("");
      setInfo(
        `${result.deletedLoans} ${vi.settings.deleteResultLoans}, ${result.deletedFines} ${vi.settings.deleteResultFines}, ${result.deletedPatrons} ${vi.settings.deleteResultPatrons}, ${result.deletedBooks} ${vi.settings.deleteResultBooks}, ${result.deletedCategories} ${vi.settings.deleteResultCategories}, ${result.deletedAuthors} ${vi.settings.deleteResultAuthors}`,
      );
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  const canDeleteAll = confirmPhrase.trim() === DELETE_ALL_CONFIRMATION_PHRASE && password.length > 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: 56 }} contentContainerStyle={{ padding: 20 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: "#64748b", marginBottom: 12 }}>&larr; {vi.common.back}</Text>
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b" }}>{vi.settings.deleteData}</Text>
      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>{vi.settings.deleteDataDesc}</Text>

      {error && (
        <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </Text>
      )}
      {info && (
        <Text style={{ color: "#047857", backgroundColor: "#ecfdf5", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {info}
        </Text>
      )}

      <View style={{ gap: 10 }}>
        <DeleteCard
          title={vi.settings.deleteLoansFines}
          desc={vi.settings.deleteLoansFinesDesc}
          countsText={counts ? `${counts.loans} ${vi.settings.countLoans}, ${counts.fines} ${vi.settings.countFines}` : ""}
          onOpen={() => openModal("loans_fines")}
        />
        <DeleteCard
          title={vi.settings.deletePatronsData}
          desc={vi.settings.deletePatronsDataDesc}
          countsText={counts ? `${counts.patrons} ${vi.settings.countPatrons}` : ""}
          onOpen={() => openModal("patrons")}
        />
        <DeleteCard
          title={vi.settings.deleteBooksData}
          desc={vi.settings.deleteBooksDataDesc}
          countsText={counts ? `${counts.books} ${vi.settings.countBooks}, ${counts.bookCopies} ${vi.settings.countBookCopies}` : ""}
          onOpen={() => openModal("books")}
        />
        <DeleteCard
          title={vi.settings.deleteCategoriesAuthorsData}
          desc={vi.settings.deleteCategoriesAuthorsDesc}
          countsText={
            counts ? `${counts.categories} ${vi.settings.countCategories}, ${counts.authors} ${vi.settings.countAuthors}` : ""
          }
          disabled={categoriesBlocked}
          disabledHint={categoriesBlocked ? vi.settings.deleteCategoriesAuthorsBlocked : undefined}
          onOpen={() => openModal("categories_authors")}
        />
      </View>

      <View
        style={{
          marginTop: 24,
          borderWidth: 2,
          borderColor: "#fecaca",
          backgroundColor: "#fef2f2",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <Text style={{ fontWeight: "700", color: "#991b1b", marginBottom: 6 }}>{vi.settings.dangerZone}</Text>
        <Text style={{ fontSize: 12, color: "#b91c1c", marginBottom: 12 }}>{vi.settings.deleteAllDataDesc}</Text>

        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
          {vi.settings.deleteAllConfirmLabel}
        </Text>
        <TextInput
          value={confirmPhrase}
          onChangeText={setConfirmPhrase}
          autoCapitalize="characters"
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white", marginBottom: 12 }}
        />

        <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginBottom: 4 }}>
          {vi.settings.deleteAllPasswordLabel}
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white", marginBottom: 12 }}
        />

        <Pressable
          onPress={handleDeleteAll}
          disabled={!canDeleteAll || deleteAll.isPending}
          style={{
            backgroundColor: "#dc2626",
            padding: 12,
            borderRadius: 8,
            opacity: !canDeleteAll || deleteAll.isPending ? 0.5 : 1,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
            {deleteAll.isPending ? vi.common.loading : vi.settings.deleteAllButton}
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 8 }}>{vi.settings.deletionLog}</Text>
        {(!logs || logs.length === 0) && <Text style={{ color: "#94a3b8", fontSize: 13 }}>{vi.settings.deletionLogEmpty}</Text>}
        {logs?.map((log) => (
          <View key={log.id} style={{ borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingVertical: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e293b" }}>{actionLabel(log.action)}</Text>
              <Text style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleString("vi-VN")}</Text>
            </View>
            <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{log.summary}</Text>
            <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {vi.settings.deletionLogActor}: {log.actorName}
            </Text>
          </View>
        ))}
      </View>

      <Modal visible={activeAction !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "white", borderRadius: 12, padding: 20 }}>
            {activeAction && (
              <>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b" }}>{ACTION_META[activeAction].title}</Text>
                <Text
                  style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12, fontSize: 13 }}
                >
                  {ACTION_META[activeAction].desc}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 4 }}>
                  {ACTION_META[activeAction].phraseLabel}
                </Text>
                <TextInput
                  autoFocus
                  value={modalPhrase}
                  onChangeText={setModalPhrase}
                  autoCapitalize="characters"
                  style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
                />
                <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155", marginTop: 12, marginBottom: 4 }}>
                  {vi.settings.deleteAllPasswordLabel}
                </Text>
                <TextInput
                  value={modalPassword}
                  onChangeText={setModalPassword}
                  secureTextEntry
                  style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10, backgroundColor: "white" }}
                />
                {modalError && (
                  <Text style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginTop: 12 }}>
                    {modalError}
                  </Text>
                )}
                <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                  <Pressable onPress={closeModal} disabled={modalPending}>
                    <Text style={{ color: "#64748b", fontWeight: "600" }}>{vi.common.cancel}</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleModalConfirm}
                    disabled={
                      modalPending || modalPhrase.trim() !== ACTION_META[activeAction].requiredPhrase || !modalPassword
                    }
                    style={{
                      backgroundColor: "#dc2626",
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      opacity:
                        modalPending || modalPhrase.trim() !== ACTION_META[activeAction].requiredPhrase || !modalPassword
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>{ACTION_META[activeAction].title}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
