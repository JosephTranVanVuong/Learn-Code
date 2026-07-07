import Link from "next/link";
import { vi } from "@thuvien/shared";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-lg font-semibold text-slate-800">Không tìm thấy trang</p>
      <p className="text-sm text-slate-500">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      <Link href="/" className="text-sm font-medium text-slate-900 hover:underline">
        &larr; {vi.common.back}
      </Link>
    </div>
  );
}
