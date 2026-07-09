"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { vi, type Patron } from "@thuvien/shared";
import { resolveAssetUrl } from "@/lib/asset-url";

export function MembershipCard({ patron }: { patron: Patron }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, patron.studentCode, {
        format: "CODE128",
        width: 2,
        height: 45,
        displayValue: true,
        fontSize: 14,
        margin: 4,
      });
    }
  }, [patron.studentCode]);

  return (
    <div className="membership-card flex h-[210px] w-[340px] flex-col justify-between rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {vi.app.shortName}
        </p>
        <p className="text-xs text-slate-400">{vi.patron.membershipCard}</p>
      </div>
      <div className="flex items-center gap-3">
        {patron.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveAssetUrl(patron.avatarUrl) ?? undefined}
            alt={patron.fullName}
            className="aspect-[2/3] w-16 shrink-0 rounded-md border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex aspect-[2/3] w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-400">
            {patron.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-slate-800">{patron.fullName}</p>
          <p className="text-xs text-slate-500">{patron.className ?? ""}</p>
        </div>
      </div>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}
