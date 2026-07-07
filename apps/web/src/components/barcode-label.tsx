"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function BarcodeLabel({
  title,
  barcode,
  location,
}: {
  title: string;
  barcode: string;
  location?: string | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, barcode, {
        format: "CODE128",
        width: 1.6,
        height: 32,
        displayValue: true,
        fontSize: 11,
        margin: 2,
      });
    }
  }, [barcode]);

  return (
    <div className="barcode-label flex h-[110px] w-[230px] flex-col items-center justify-between rounded-md border border-slate-300 bg-white p-2">
      <p className="line-clamp-2 w-full text-center text-[11px] font-medium leading-tight text-slate-800">
        {title}
      </p>
      <svg ref={svgRef} />
      {location && <p className="text-[9px] text-slate-400">{location}</p>}
    </div>
  );
}
