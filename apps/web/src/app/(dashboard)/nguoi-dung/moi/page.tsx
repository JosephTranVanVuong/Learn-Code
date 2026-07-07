"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ApiError, STAFF_ROLE_VALUES, vi } from "@thuvien/shared";
import { useCreateUser } from "@/hooks/use-users";
import { Button, ButtonLink } from "@/components/ui/button";

type StaffRole = (typeof STAFF_ROLE_VALUES)[number];

export default function ThemNguoiDungPage() {
  const router = useRouter();
  const createUser = useCreateUser();

  const [form, setForm] = useState<{ fullName: string; email: string; password: string; role: StaffRole }>({
    fullName: "",
    email: "",
    password: "",
    role: "THU_THU",
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createUser.mutateAsync(form);
      router.push("/nguoi-dung");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | null;
        setError(body?.message ?? vi.common.error);
      } else {
        setError(vi.common.error);
      }
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/nguoi-dung" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.user.addNew}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.user.fullName}</label>
          <input
            required
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.user.email}</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.user.password}</label>
          <input
            type="text"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.user.role}</label>
          <select
            value={form.role}
            onChange={(e) => update("role", e.target.value as StaffRole)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {STAFF_ROLE_VALUES.map((role) => (
              <option key={role} value={role}>
                {vi.roles[role]}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <ButtonLink href="/nguoi-dung" variant="ghost">
            {vi.common.cancel}
          </ButtonLink>
          <Button icon={Save} type="submit" disabled={createUser.isPending}>
            {vi.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
