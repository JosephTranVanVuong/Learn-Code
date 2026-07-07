"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Upload } from "lucide-react";
import { ApiError, vi } from "@thuvien/shared";
import { booksApi } from "@/lib/resources";
import { useCategories } from "@/hooks/use-categories";
import { useAuthors } from "@/hooks/use-authors";
import { useCreateBook } from "@/hooks/use-books";
import { Button, ButtonLink } from "@/components/ui/button";

const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_COVER_SIZE = 5 * 1024 * 1024;

export default function ThemSachPage() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const { data: authors } = useAuthors();
  const createBook = useCreateBook();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selectedAuthor = authors?.find((a) => a.id === form.authorId);
  const selectedCategory = categories?.find((c) => c.id === form.categoryId);

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!ALLOWED_COVER_TYPES.includes(file.type)) {
      setError(vi.book.coverInvalidType);
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      setError(vi.book.coverTooLarge);
      return;
    }
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveCoverFile() {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(null);
    setCoverPreviewUrl(null);
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
      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        try {
          await booksApi.uploadCover(book.id, formData);
        } catch {
          // Sách đã tạo thành công; ảnh bìa có thể tải lại từ trang sửa sách nếu bước này lỗi.
        }
      }
      router.push("/sach");
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
    <div>
      <Link href="/sach" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>

      <h1 className="mt-2 text-lg font-semibold text-slate-800">{vi.book.addNew}</h1>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6">
              {coverPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreviewUrl}
                  alt={form.title || vi.book.coverImage}
                  className="aspect-[2/3] w-40 rounded-md border border-slate-200 object-cover"
                />
              ) : (
                <div className="aspect-[2/3] w-40 overflow-hidden rounded-md border border-dashed border-slate-300 bg-gradient-to-br from-[#0f1c3a] to-[#1c2f57]">
                  <div className="flex h-full w-full items-center justify-center p-3 text-center">
                    <span className="text-xs font-medium leading-snug text-[#c9a24b]/80">
                      {form.title || vi.book.noCover}
                    </span>
                  </div>
                </div>
              )}
              <p className="mt-3 text-center text-sm font-medium text-slate-800">
                {form.title || vi.book.title}
              </p>
              <p className="text-center text-xs text-slate-500">
                {selectedAuthor?.name || vi.book.selectAuthor}
              </p>
              {selectedCategory && (
                <span className="mt-2 rounded-full bg-[#f6efdd] px-3 py-1 text-xs font-medium text-[#0f1c3a]">
                  {selectedCategory.name}
                </span>
              )}
              <div className="mt-4 flex w-full flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  icon={Upload}
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {coverFile ? vi.book.changeCover : vi.book.uploadCover}
                </Button>
                {coverFile && (
                  <Button type="button" icon={Trash2} variant="danger" size="sm" onClick={handleRemoveCoverFile}>
                    {vi.book.removeCover}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-[#0f1c3a]">{vi.book.sectionBasicInfo}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
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
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-[#0f1c3a]">{vi.book.sectionPublicationInfo}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">{vi.book.description}</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-[#0f1c3a]">{vi.book.sectionCopiesLocation}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <ButtonLink href="/sach" variant="ghost">
                {vi.common.cancel}
              </ButtonLink>
              <Button icon={Save} type="submit" disabled={createBook.isPending}>
                {vi.common.save}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
