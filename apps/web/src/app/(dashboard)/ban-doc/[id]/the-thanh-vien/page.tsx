"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { vi } from "@thuvien/shared";
import { usePatron } from "@/hooks/use-patrons";
import { MembershipCard } from "@/components/membership-card";
import { Button } from "@/components/ui/button";

export default function TheThanhVienPage() {
  const params = useParams<{ id: string }>();
  const { data: patron, isLoading } = usePatron(params.id);

  if (isLoading || !patron) {
    return <p className="text-sm text-slate-400">{vi.common.loading}</p>;
  }

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/ban-doc/${params.id}`} className="flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          {vi.common.back}
        </Link>
        <Button icon={Printer} onClick={() => window.print()}>
          {vi.patron.printCard}
        </Button>
      </div>

      <div className="print-area flex justify-center">
        <MembershipCard patron={patron} />
      </div>
    </div>
  );
}
