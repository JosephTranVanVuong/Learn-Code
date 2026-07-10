"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { vi } from "@thuvien/shared";
import { useUsers } from "@/hooks/use-users";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 20;

export default function NguoiDungPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading } = useUsers({ search: search || undefined, page, pageSize: PAGE_SIZE });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">{vi.nav.users}</h1>
        <ButtonLink icon={Plus} href="/nguoi-dung/moi">
          {vi.user.addNew}
        </ButtonLink>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={vi.user.searchPlaceholder}
          className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
            <tr>
              <th className="px-4 py-2">{vi.common.stt}</th>
              <th className="px-4 py-2">{vi.user.fullName}</th>
              <th className="px-4 py-2">{vi.user.email}</th>
              <th className="px-4 py-2">{vi.user.role}</th>
              <th className="px-4 py-2">{vi.common.confirm}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                  {vi.common.loading}
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                  {vi.user.noResults}
                </td>
              </tr>
            )}
            {data?.items.map((u, index) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-400">{(page - 1) * PAGE_SIZE + index + 1}</td>
                <td className="px-4 py-2">
                  <Link href={`/nguoi-dung/${u.id}`} className="font-medium text-slate-800 hover:underline">
                    {u.fullName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2 text-slate-600">{vi.roles[u.role]}</td>
                <td className="px-4 py-2">
                  {u.isActive ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      {vi.user.isActive}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {vi.user.inactive}
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
