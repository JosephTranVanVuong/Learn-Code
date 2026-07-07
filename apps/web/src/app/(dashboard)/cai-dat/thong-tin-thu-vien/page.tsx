"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Upload } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { resolveAssetUrl } from "@/lib/asset-url";
import { Button } from "@/components/ui/button";
import {
  useLibrarySettings,
  useRemoveLibraryLogo,
  useUpdateLibrarySettings,
  useUploadLibraryLogo,
} from "@/hooks/use-settings";

const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

export default function ThongTinThuVienPage() {
  const { data: settings, isLoading } = useLibrarySettings();
  const updateSettings = useUpdateLibrarySettings();
  const uploadLogo = useUploadLibraryLogo();
  const removeLogo = useRemoveLibraryLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{ name: string; address: string; phone: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (settings && !form) {
      setForm({
        name: settings.name,
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
      });
    }
  }, [settings, form]);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setInfo(null);
    try {
      await updateSettings.mutateAsync(form);
      setInfo(vi.settings.saved);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError(vi.book.coverInvalidType);
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setError(vi.book.coverTooLarge);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadLogo.mutateAsync(formData);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleRemoveLogo() {
    if (!confirm(vi.settings.removeLogo + "?")) return;
    try {
      await removeLogo.mutateAsync();
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  if (isLoading || !form) {
    return <p className="text-sm text-slate-400">{vi.common.loading}</p>;
  }

  return (
    <div className="max-w-lg">
      <Link href="/cai-dat" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.settings.libraryInfo}</h1>

      <div className="mt-4 flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-6">
        {settings?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveAssetUrl(settings.logoUrl) ?? undefined}
            alt={vi.settings.libraryLogo}
            className="h-20 w-20 rounded-md border border-slate-200 object-contain"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">
            {vi.settings.noLogo}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoChange}
            className="hidden"
          />
          <Button icon={Upload} size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadLogo.isPending}>
            {settings?.logoUrl ? vi.settings.changeLogo : vi.settings.uploadLogo}
          </Button>
          {settings?.logoUrl && (
            <Button icon={Trash2} variant="danger" size="sm" onClick={handleRemoveLogo} disabled={removeLogo.isPending}>
              {vi.settings.removeLogo}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <form onSubmit={handleSave} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.settings.libraryName}</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.settings.libraryAddress}</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.settings.libraryPhone}</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.settings.libraryEmail}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex justify-end">
          <Button icon={Save} type="submit" disabled={updateSettings.isPending}>
            {vi.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
