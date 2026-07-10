"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function BarcodeLabel({ barcode, location }: { barcode: string; location?: string | null }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, barcode, {
        format: "CODE128",
        width: 0.9,
        height: 22,
        displayValue: false,
        margin: 0,
      });
    }
  }, [barcode]);

  return (
    <div className="barcode-label box-border flex h-[17mm] w-[50mm] flex-col items-center justify-between border border-slate-300 bg-white px-[1mm] py-[0.5mm]">
      <p className="w-full text-center font-mono leading-none text-slate-800" style={{ fontSize: "8px" }}>
        {barcode}
      </p>
      <svg ref={svgRef} />
      <p className="w-full text-center leading-none text-slate-600" style={{ fontSize: "8px" }}>
        {location || " "}
      </p>
    </div>
  );
}
