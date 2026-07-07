"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { vi } from "@thuvien/shared";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold text-slate-800">{vi.common.error}</p>
      <p className="max-w-md text-sm text-slate-500">
        Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại, nếu vẫn còn lỗi hãy liên hệ thủ thư quản trị.
      </p>
      <Button icon={RefreshCw} onClick={reset}>
        Thử lại
      </Button>
    </div>
  );
}
