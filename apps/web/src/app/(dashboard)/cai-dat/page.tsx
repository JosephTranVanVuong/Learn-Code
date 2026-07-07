import Link from "next/link";
import {
  Barcode,
  CircleDollarSign,
  DatabaseBackup,
  Library,
  Mail,
  ScrollText,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { vi } from "@thuvien/shared";

const SETTINGS_ITEMS: { href: string; icon: LucideIcon; label: string; desc: string }[] = [
  { href: "/cai-dat/thong-tin-thu-vien", icon: Library, label: vi.settings.libraryInfo, desc: "Tên, địa chỉ, liên hệ, logo" },
  { href: "/cai-dat/loai-doc-gia", icon: Users, label: vi.settings.patronTypes, desc: vi.settings.patronTypesDesc },
  { href: "/cai-dat/quy-dinh-muon", icon: ScrollText, label: vi.settings.loanPolicy, desc: vi.settings.loanPolicyDesc },
  { href: "/cai-dat/muc-phat", icon: CircleDollarSign, label: vi.settings.finePolicy, desc: "Mức phạt mỗi ngày trễ hạn" },
  { href: "/cai-dat/barcode", icon: Barcode, label: vi.settings.barcode, desc: "Tiền tố mã vạch tự sinh" },
  { href: "/cai-dat/email", icon: Mail, label: vi.settings.email, desc: "Trạng thái SMTP, gửi thử" },
  { href: "/cai-dat/sao-luu", icon: DatabaseBackup, label: `${vi.settings.backup} / ${vi.settings.restore}`, desc: vi.settings.backupRestoreDesc },
  { href: "/cai-dat/xoa-du-lieu", icon: Trash2, label: vi.settings.deleteData, desc: vi.settings.deleteDataDesc },
];

export default function CaiDatPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-[#0f1c3a]">{vi.settings.title}</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#c9a24b] hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f1c3a] text-[#c9a24b]">
              <item.icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 group-hover:text-[#0f1c3a]">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
