"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Library, LogIn, Search } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/tong-quan");
    }
  }, [isLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      router.replace("/tong-quan");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | null;
        setError(body?.message ?? vi.auth.invalidCredentials);
      } else {
        setError(vi.common.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f1c3a]">
          <Library className="h-6 w-6 text-[#c9a24b]" strokeWidth={1.75} />
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-slate-800">
          {vi.app.name}
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">{vi.auth.loginTitle}</p>
        <p className="mt-1 text-center text-xs text-slate-400">{vi.auth.loginSubtitle}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {vi.auth.identifier}
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder={vi.auth.identifierPlaceholder}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {vi.auth.password}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button icon={LogIn} type="submit" disabled={submitting} className="w-full">
            {submitting ? vi.common.loading : vi.auth.loginButton}
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-[11px] text-slate-400">
          <span>{vi.roles.QUAN_TRI}</span>
          <span>·</span>
          <span>{vi.roles.THU_THU}</span>
          <span>·</span>
          <span>{vi.roles.CONG_TAC_VIEN}</span>
          <span>·</span>
          <span>{vi.roles.CHUNG_SINH}</span>
        </div>

        <Link
          href="/tra-cuu"
          className="mt-4 flex items-center justify-center gap-1.5 text-center text-sm text-slate-500 hover:underline"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
          {vi.publicCatalog.title} ({vi.publicCatalog.subtitle})
        </Link>
      </div>
    </div>
  );
}
