"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  CircleDollarSign,
  LayoutDashboard,
  Library,
  LogOut,
  PenLine,
  Settings,
  Tags,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_ROLES, STAFF_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "@/lib/auth-context";

const STAFF_ONLY_PATHS = [
  "/the-loai",
  "/tac-gia",
  "/ban-doc",
  "/muon-tra",
  "/phat",
  "/thong-bao",
  "/bao-cao",
  "/sach/moi",
  "/sach/nhap-excel",
];

const STAFF_ONLY_SUFFIXES = ["/ma-vach"];

const ADMIN_ONLY_PATHS = ["/nguoi-dung", "/cai-dat"];

const NAV_ICONS: Record<string, LucideIcon> = {
  "/tong-quan": LayoutDashboard,
  "/sach": BookOpen,
  "/the-loai": Tags,
  "/tac-gia": PenLine,
  "/ban-doc": Users,
  "/muon-tra": ArrowLeftRight,
  "/phat": CircleDollarSign,
  "/thong-bao": Bell,
  "/bao-cao": BarChart3,
  "/nguoi-dung": UserCog,
  "/cai-dat": Settings,
};

const STAFF_NAV_ITEMS = [
  { href: "/tong-quan", label: vi.nav.dashboard },
  { href: "/sach", label: vi.nav.books },
  { href: "/the-loai", label: vi.nav.categories },
  { href: "/tac-gia", label: vi.nav.authors },
  { href: "/ban-doc", label: vi.nav.patrons },
  { href: "/muon-tra", label: vi.nav.loans },
  { href: "/phat", label: vi.nav.fines },
  { href: "/thong-bao", label: vi.nav.notifications },
  { href: "/bao-cao", label: vi.nav.reports },
];

const ADMIN_NAV_ITEMS = [
  { href: "/nguoi-dung", label: vi.nav.users },
  { href: "/cai-dat", label: vi.nav.settings },
];

const PATRON_NAV_ITEMS = [
  { href: "/tong-quan", label: vi.nav.dashboard },
  { href: "/sach", label: vi.nav.books },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/dang-nhap");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!isLoading && user && !STAFF_ROLES.includes(user.role)) {
      const isStaffOnly =
        STAFF_ONLY_PATHS.some((p) => pathname.startsWith(p)) ||
        STAFF_ONLY_SUFFIXES.some((s) => pathname.endsWith(s));
      if (isStaffOnly) {
        router.replace("/tong-quan");
      }
    }
  }, [isLoading, user, pathname, router]);

  useEffect(() => {
    if (!isLoading && user && !ADMIN_ROLES.includes(user.role)) {
      const isAdminOnly = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
      if (isAdminOnly) {
        router.replace("/tong-quan");
      }
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        {vi.common.loading}
      </div>
    );
  }

  const isAdmin = ADMIN_ROLES.includes(user.role);
  const NAV_ITEMS = STAFF_ROLES.includes(user.role)
    ? isAdmin
      ? [...STAFF_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
      : STAFF_NAV_ITEMS
    : PATRON_NAV_ITEMS;

  return (
    <div className="flex flex-1">
      <aside className="no-print flex w-64 flex-col bg-[#0f1c3a]">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#c9a24b]/15">
            <Library className="h-5 w-5 text-[#c9a24b]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p
              title={vi.app.shortName}
              className="truncate text-sm font-semibold tracking-wide text-[#f1ecdf]"
            >
              {vi.app.shortName}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {user.fullName} · {vi.roles[user.role]}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = NAV_ICONS[item.href];
            return (
              <a
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-[#c9a24b] bg-white/[0.07] font-medium text-white"
                    : "border-transparent text-slate-300 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-[#c9a24b]" : "text-slate-400 group-hover:text-[#c9a24b]"}`}
                    strokeWidth={1.75}
                  />
                )}
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-2">
          <button
            onClick={async () => {
              await logout();
              router.replace("/dang-nhap");
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
            {vi.nav.logout}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
