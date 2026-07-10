"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Barcode, Plus, Printer, Upload } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { resolveAssetUrl } from "@/lib/asset-url";
import { patronsApi } from "@/lib/resources";
import { usePatrons } from "@/hooks/use-patrons";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 20;

export default function BanDocPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading } = usePatrons({ search: search || undefined, page, pageSize: PAGE_SIZE });

  async function handleScanSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = scanCode.trim();
    if (!code) return;
    setScanError(null);
    setScanBusy(true);
    try {
      const patron = await patronsApi.getByCode(code);
      setScanCode("");
      router.push(`/ban-doc/${patron.id}`);
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { message?: string } | null) : null;
      setScanError(body?.message ?? vi.patron.cardNotFound);
    } finally {
      setScanBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">{vi.nav.patrons}</h1>
        <div className="flex gap-2">
          <ButtonLink icon={Printer} variant="secondary" href="/ban-doc/in-the">
            {vi.patron.printAllCards}
          </ButtonLink>
          <ButtonLink icon={Upload} variant="secondary" href="/ban-doc/nhap-excel">
            {vi.patron.importExcel}
          </ButtonLink>
          <ButtonLink icon={Plus} href="/ban-doc/moi">
            {vi.patron.addNew}
          </ButtonLink>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={vi.patron.searchPlaceholder}
          className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <div className="relative">
          <Barcode
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onKeyDown={handleScanSearch}
            disabled={scanBusy}
            placeholder={vi.patron.scanSearch}
            className="w-72 rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
          />
        </div>
      </div>

      {scanError && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{scanError}</p>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
            <tr>
              <th className="px-4 py-2">{vi.common.stt}</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">{vi.patron.studentCode}</th>
              <th className="px-4 py-2">{vi.patron.fullName}</th>
              <th className="px-4 py-2">{vi.patron.className}</th>
              <th className="px-4 py-2">{vi.patron.patronType}</th>
              <th className="px-4 py-2">{vi.common.confirm}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                  {vi.common.loading}
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                  {vi.patron.noResults}
                </td>
              </tr>
            )}
            {data?.items.map((patron, index) => (
              <tr key={patron.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-400">{(page - 1) * PAGE_SIZE + index + 1}</td>
                <td className="px-4 py-2">
                  {patron.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveAssetUrl(patron.avatarUrl) ?? undefined}
                      alt={patron.fullName}
                      className="aspect-[2/3] w-8 rounded border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[2/3] w-8 items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-400">
                      {patron.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{patron.studentCode}</td>
                <td className="px-4 py-2">
                  <Link href={`/ban-doc/${patron.id}`} className="font-medium text-slate-800 hover:underline">
                    {patron.fullName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{patron.className ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{patron.patronTypeName ?? vi.patron.noPatronType}</td>
                <td className="px-4 py-2">
                  {patron.isActive ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      {vi.patron.isActive}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {vi.patron.inactive}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
