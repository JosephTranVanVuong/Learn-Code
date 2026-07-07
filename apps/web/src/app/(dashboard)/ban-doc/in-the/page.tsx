"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { vi } from "@thuvien/shared";
import { useAllPatrons } from "@/hooks/use-patrons";
import { MembershipCard } from "@/components/membership-card";
import { Button } from "@/components/ui/button";

export default function InTheHangLoatPage() {
  const { data, isLoading, isError } = useAllPatrons();
  const activePatrons = data?.filter((p) => p.isActive) ?? [];

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/ban-doc" className="flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          {vi.common.back}
        </Link>
        <Button icon={Printer} onClick={() => window.print()} disabled={isLoading || activePatrons.length === 0}>
          {vi.patron.printAllCards}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-400">{vi.common.loading}</p>}
      {isError && <p className="text-sm text-red-600">{vi.common.error}</p>}
      {!isLoading && !isError && activePatrons.length === 0 && (
        <p className="text-sm text-slate-400">{vi.patron.noResults}</p>
      )}

      <div className="print-area flex flex-wrap gap-4">
        {activePatrons.map((patron) => (
          <MembershipCard key={patron.id} patron={patron} />
        ))}
      </div>
    </div>
  );
}
