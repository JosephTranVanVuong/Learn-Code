"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { useCreatePatron } from "@/hooks/use-patrons";
import { usePatronTypes } from "@/hooks/use-patron-types";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ThemChungSinhPage() {
  const router = useRouter();
  const createPatron = useCreatePatron();
  const { data: patronTypes } = usePatronTypes();

  const [form, setForm] = useState({
    studentCode: "",
    fullName: "",
    className: "",
    phone: "",
    email: "",
    password: "",
    patronTypeId: "",
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createPatron.mutateAsync({
        studentCode: form.studentCode,
        fullName: form.fullName,
        className: form.className || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        password: form.password,
        patronTypeId: form.patronTypeId || undefined,
      });
      router.push("/ban-doc");
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
      <Link href="/ban-doc" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.patron.addNew}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.patron.studentCode}</label>
          <input
            required
            value={form.studentCode}
            onChange={(e) => update("studentCode", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.patron.fullName}</label>
          <input
            required
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.patron.className}</label>
          <input
            value={form.className}
            onChange={(e) => update("className", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.patron.patronType}</label>
          <select
            value={form.patronTypeId}
            onChange={(e) => update("patronTypeId", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">{vi.patron.noPatronType}</option>
            {patronTypes?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.patron.phone}</label>
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.patron.email}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{vi.patron.password}</label>
          <input
            type="text"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <ButtonLink href="/ban-doc" variant="ghost">
            {vi.common.cancel}
          </ButtonLink>
          <Button icon={Save} type="submit" disabled={createPatron.isPending}>
            {vi.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
