"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw, Trash2, Upload } from "lucide-react";
import { ApiError, RESTORE_CONFIRM_PHRASE, vi, type BackupEntry } from "@thuvien/shared";
import { settingsApi } from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import {
  useBackups,
  useBackupSettings,
  useCreateBackup,
  useDeleteBackup,
  useRestoreBackupUpload,
  useRestoreFromBackup,
  useUpdateBackupSettings,
} from "@/hooks/use-settings";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function labelText(label: string): string {
  if (label === "manual") return vi.settings.backupLabelManual;
  if (label === "auto") return vi.settings.backupLabelAuto;
  return vi.settings.backupLabelOther;
}

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | null;
    return body?.message ?? fallback;
  }
  return fallback;
}

type RestoreTarget = { kind: "history"; filename: string } | { kind: "upload"; file: File };

export default function SaoLuuPage() {
  const { data: backupSettings } = useBackupSettings();
  const updateBackupSettings = useUpdateBackupSettings();
  const { data: backups } = useBackups();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const restoreFromBackup = useRestoreFromBackup();
  const restoreUpload = useRestoreBackupUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [autoEnabled, setAutoEnabled] = useState<boolean | null>(null);
  const [retentionInput, setRetentionInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [downloadingFilename, setDownloadingFilename] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<RestoreTarget | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const effectiveAutoEnabled = autoEnabled ?? backupSettings?.autoBackupEnabled ?? true;
  const effectiveRetention = retentionInput ?? String(backupSettings?.retentionCount ?? 7);
  const restoring = restoreFromBackup.isPending || restoreUpload.isPending;

  async function handleSaveBackupSettings() {
    setError(null);
    setInfo(null);
    try {
      await updateBackupSettings.mutateAsync({
        autoBackupEnabled: effectiveAutoEnabled,
        retentionCount: Number(effectiveRetention) || 7,
      });
      setAutoEnabled(null);
      setRetentionInput(null);
      setInfo(vi.common.save + " ✓");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleCreateBackup() {
    setError(null);
    setInfo(null);
    try {
      await createBackup.mutateAsync();
      setInfo(`${vi.settings.backupNow} ✓`);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDownload(entry: BackupEntry) {
    setError(null);
    setDownloadingFilename(entry.filename);
    try {
      const blob = await settingsApi.downloadBackupFile(entry.filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    } finally {
      setDownloadingFilename(null);
    }
  }

  async function handleDelete(filename: string) {
    if (!confirm(vi.settings.backupDeleteConfirm)) return;
    setError(null);
    try {
      await deleteBackup.mutateAsync(filename);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function openRestoreFromHistory(filename: string) {
    setRestoreTarget({ kind: "history", filename });
    setConfirmText("");
    setRestoreError(null);
  }

  function handleChooseUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.name.endsWith(".db")) {
      setError(vi.settings.restoreInvalidFile);
      return;
    }
    setError(null);
    setInfo(null);
    setRestoreTarget({ kind: "upload", file });
    setConfirmText("");
    setRestoreError(null);
  }

  function closeRestoreModal() {
    if (restoring) return;
    setRestoreTarget(null);
    setConfirmText("");
    setRestoreError(null);
  }

  async function handleConfirmRestore() {
    if (!restoreTarget) return;
    setRestoreError(null);
    if (confirmText !== RESTORE_CONFIRM_PHRASE) {
      setRestoreError(vi.settings.restoreConfirmPhraseMismatch);
      return;
    }
    try {
      if (restoreTarget.kind === "history") {
        await restoreFromBackup.mutateAsync({ filename: restoreTarget.filename, confirm: confirmText });
      } else {
        const formData = new FormData();
        formData.append("file", restoreTarget.file);
        await restoreUpload.mutateAsync({ formData, confirm: confirmText });
      }
      setRestoreTarget(null);
      setConfirmText("");
      setInfo(vi.settings.restoreSuccess);
    } catch (err) {
      setRestoreError(extractMessage(err, vi.common.error));
    }
  }

  return (
    <div>
      <Link href="/cai-dat" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">
        {vi.settings.backup} / {vi.settings.restore}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{vi.settings.backupRestoreDesc}</p>
      <p className="mt-1 text-xs text-slate-400">{vi.settings.threeTwoOneTip}</p>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-800">{vi.settings.backupAutoSettings}</h2>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-700">{vi.settings.backupAutoEnabled}</span>
              <Switch checked={effectiveAutoEnabled} onChange={setAutoEnabled} />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">{vi.settings.backupRetentionCount}</label>
              <input
                type="number"
                min={1}
                max={90}
                value={effectiveRetention}
                onChange={(e) => setRetentionInput(e.target.value)}
                className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">{vi.settings.backupRetentionDesc}</p>
            </div>
            <div className="mt-4">
              <Button size="sm" onClick={handleSaveBackupSettings} disabled={updateBackupSettings.isPending}>
                {vi.common.save}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-800">{vi.settings.backup}</h2>
            <div className="mt-4">
              <Button icon={RefreshCw} size="sm" onClick={handleCreateBackup} disabled={createBackup.isPending}>
                {vi.settings.backupNow}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-800">{vi.settings.restoreSubmit}</h2>
            <div className="mt-4">
              <input ref={fileInputRef} type="file" accept=".db" onChange={handleChooseUploadFile} className="hidden" />
              <Button icon={Upload} variant="danger" onClick={() => fileInputRef.current?.click()}>
                {vi.settings.restoreFile}
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-800">{vi.settings.backupHistory}</h2>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
                  <tr>
                    <th className="px-3 py-2">{vi.settings.backupType}</th>
                    <th className="px-3 py-2">{vi.settings.backupCreatedAt}</th>
                    <th className="px-3 py-2">{vi.settings.backupSize}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {(!backups || backups.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                        {vi.settings.backupEmpty}
                      </td>
                    </tr>
                  )}
                  {backups?.map((entry) => (
                    <tr key={entry.filename} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {labelText(entry.label)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{new Date(entry.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2 text-slate-600">{formatBytes(entry.sizeBytes)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            icon={Download}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(entry)}
                            disabled={downloadingFilename === entry.filename}
                          >
                            {vi.settings.backupDownload}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openRestoreFromHistory(entry.filename)}
                          >
                            {vi.settings.backupRestoreFromHistory}
                          </Button>
                          <Button
                            icon={Trash2}
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(entry.filename)}
                            disabled={deleteBackup.isPending}
                          >
                            {vi.common.delete}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={restoreTarget !== null}
        onClose={closeRestoreModal}
        title={vi.settings.restore}
      >
        <div className="space-y-4">
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{vi.settings.restoreConfirm}</p>
          {restoreTarget?.kind === "upload" && (
            <p className="text-sm text-slate-600">
              {vi.settings.restoreFile}: <span className="font-medium">{restoreTarget.file.name}</span>
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.settings.restoreConfirmPhraseLabel}</label>
            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          {restoreError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{restoreError}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={closeRestoreModal} disabled={restoring}>
              {vi.common.cancel}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmRestore}
              disabled={restoring || confirmText !== RESTORE_CONFIRM_PHRASE}
            >
              {vi.settings.restore}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
