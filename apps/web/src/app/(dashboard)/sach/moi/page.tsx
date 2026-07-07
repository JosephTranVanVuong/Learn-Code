"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { useCategories } from "@/hooks/use-categories";
import { useAuthors } from "@/hooks/use-authors";
import { useCreateBook } from "@/hooks/use-books";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ThemSachPage() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const { data: authors } = useAuthors();
  const createBook = useCreateBook();

  const [form, setForm] = useState({
    title: "",
    authorId: "",
    categoryId: "",
    publisher: "",
    publishedYear: "",
    isbn: "",
    language: "Tiếng Việt",
    description: "",
    initialCopies: "1",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const book = await createBook.mutateAsync({
        title: form.title,
        authorId: form.authorId,
        categoryId: form.categoryId,
        publisher: form.publisher || undefined,
        publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
        isbn: form.isbn || undefined,
        language: form.language || undefined,
        description: form.description || undefined,
        initialCopies: Number(form.initialCopies) || 0,
        location: form.location || undefined,
      });
      router.push(`/sach/${book.id}`);
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
    <div className="max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/sach" className="flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          {vi.common.back}
        </Link>
      </div>
      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.book.addNew}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700">{vi.book.title}</label>
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.book.author}</label>
            <select
              required
              value={form.authorId}
              onChange={(e) => update("authorId", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="" disabled>
                {vi.book.selectAuthor}
              </option>
              {authors?.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.book.category}</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="" disabled>
                {vi.book.category}
              </option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.book.publisher}</label>
            <input
              value={form.publisher}
              onChange={(e) => update("publisher", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.book.publishedYear}</label>
            <input
              type="number"
              value={form.publishedYear}
              onChange={(e) => update("publishedYear", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.book.isbn}</label>
            <input
              value={form.isbn}
              onChange={(e) => update("isbn", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.book.language}</label>
            <input
              value={form.language}
              onChange={(e) => update("language", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.book.initialCopies}</label>
            <input
              type="number"
              min={0}
              max={50}
              value={form.initialCopies}
              onChange={(e) => update("initialCopies", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.copy.location}</label>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700">{vi.book.description}</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <ButtonLink href="/sach" variant="ghost">
            {vi.common.cancel}
          </ButtonLink>
          <Button icon={Save} type="submit" disabled={createBook.isPending}>
            {vi.common.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
