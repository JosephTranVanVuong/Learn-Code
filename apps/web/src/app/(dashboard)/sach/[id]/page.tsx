"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Printer, Save, Trash2, Upload } from "lucide-react";
import { ApiError, DESTRUCTIVE_ROLES, STAFF_ROLES, vi, type CopyStatus } from "@thuvien/shared";
import { useAuth } from "@/lib/auth-context";
import { resolveAssetUrl } from "@/lib/asset-url";
import { useCategories } from "@/hooks/use-categories";
import { useAuthors } from "@/hooks/use-authors";
import {
  useBook,
  useDeleteBook,
  useRemoveBookCover,
  useUpdateBook,
  useUpdateBookCopiesLocation,
  useUploadBookCover,
} from "@/hooks/use-books";
import { useAddCopies, useDeleteCopy, useUpdateCopy } from "@/hooks/use-copies";
import { Button, ButtonLink } from "@/components/ui/button";

const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_COVER_SIZE = 5 * 1024 * 1024;

const COPY_STATUS_OPTIONS: CopyStatus[] = ["AVAILABLE", "BORROWED", "LOST", "DAMAGED", "WITHDRAWN"];

function commonCopyLocation(copies: { location: string | null }[]): string {
  if (copies.length === 0) return "";
  const first = copies[0].location ?? "";
  return copies.every((c) => (c.location ?? "") === first) ? first : "";
}

export default function ChiTietSachPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;
  const canDelete = user ? DESTRUCTIVE_ROLES.includes(user.role) : false;
  const { data: book, isLoading } = useBook(params.id);
  const { data: categories } = useCategories();
  const { data: authors } = useAuthors();
  const updateBook = useUpdateBook(params.id);
  const updateCopiesLocation = useUpdateBookCopiesLocation(params.id);
  const deleteBook = useDeleteBook();
  const addCopies = useAddCopies(params.id);
  const updateCopy = useUpdateCopy(params.id);
  const deleteCopy = useDeleteCopy(params.id);
  const uploadCover = useUploadBookCover(params.id);
  const removeCover = useRemoveBookCover(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    title: string;
    authorId: string;
    categoryId: string;
    publisher: string;
    publishedYear: string;
    isbn: string;
    language: string;
    description: string;
    classificationNumber: string;
    authorMark: string;
    location: string;
  } | null>(null);
  const [initialLocation, setInitialLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newCopyQty, setNewCopyQty] = useState("1");
  const [newCopyLocation, setNewCopyLocation] = useState("");

  useEffect(() => {
    if (book && !form) {
      const location = commonCopyLocation(book.copies);
      setForm({
        title: book.title,
        authorId: book.authorId,
        categoryId: book.categoryId,
        publisher: book.publisher ?? "",
        publishedYear: book.publishedYear ? String(book.publishedYear) : "",
        isbn: book.isbn ?? "",
        language: book.language ?? "",
        description: book.description ?? "",
        classificationNumber: book.classificationNumber ?? "",
        authorMark: book.authorMark ?? "",
        location,
      });
      setInitialLocation(location);
    }
  }, [book, form]);

  function extractMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? fallback;
    }
    return fallback;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    try {
      await updateBook.mutateAsync({
        title: form.title,
        authorId: form.authorId,
        categoryId: form.categoryId,
        publisher: form.publisher || undefined,
        publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
        isbn: form.isbn || undefined,
        language: form.language || undefined,
        description: form.description || undefined,
        classificationNumber: form.classificationNumber || undefined,
        authorMark: form.authorMark || undefined,
      });
      if (form.location !== initialLocation) {
        await updateCopiesLocation.mutateAsync({ location: form.location });
        setInitialLocation(form.location);
      }
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeleteBook() {
    if (!confirm(vi.book.deleteConfirm)) return;
    try {
      await deleteBook.mutateAsync(params.id);
      router.push("/sach");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadCover.mutateAsync(formData);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleRemoveCover() {
    if (!confirm(vi.book.removeCoverConfirm)) return;
    setError(null);
    try {
      await removeCover.mutateAsync();
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleAddCopies(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addCopies.mutateAsync({
        quantity: Number(newCopyQty) || 1,
        location: newCopyLocation || undefined,
      });
      setNewCopyQty("1");
      setNewCopyLocation("");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleCopyStatusChange(copyId: string, status: CopyStatus) {
    setError(null);
    try {
      await updateCopy.mutateAsync({ id: copyId, input: { status } });
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleCopyLocationChange(copyId: string, location: string) {
    setError(null);
    try {
      await updateCopy.mutateAsync({ id: copyId, input: { location } });
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeleteCopy(copyId: string) {
    if (!confirm(vi.copy.deleteConfirm)) return;
    setError(null);
    try {
      await deleteCopy.mutateAsync(copyId);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  if (isLoading || !form) {
    return <p className="text-sm text-slate-400">{vi.common.loading}</p>;
  }

  if (!book) {
    return <p className="text-sm text-slate-400">{vi.common.noData}</p>;
  }

  return (
    <div>
      <Link href="/sach" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-slate-800">
          {isStaff ? vi.book.editBook : book.title}
        </h1>
        {canDelete && (
          <Button icon={Trash2} variant="danger" size="sm" onClick={handleDeleteBook}>
            {vi.common.delete}
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6">
            {book.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveAssetUrl(book.coverImageUrl) ?? undefined}
                alt={book.title}
                className="aspect-[2/3] w-40 rounded-md border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] w-40 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">
                {vi.book.noCover}
              </div>
            )}
            <p className="mt-3 text-center text-sm font-medium text-slate-800">{book.title}</p>
            <p className="text-center text-xs text-slate-500">{book.author.name}</p>
            {isStaff && (
              <div className="mt-4 flex w-full flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <Button
                  icon={Upload}
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadCover.isPending}
                >
                  {book.coverImageUrl ? vi.book.changeCover : vi.book.uploadCover}
                </Button>
                {book.coverImageUrl && canDelete && (
                  <Button icon={Trash2} variant="danger" size="sm" onClick={handleRemoveCover} disabled={removeCover.isPending}>
                    {vi.book.removeCover}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!isStaff && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-6 text-sm">
              <p>
                <span className="font-medium text-slate-700">{vi.book.author}:</span>{" "}
                <span className="text-slate-600">{book.author.name}</span>
              </p>
              <p>
                <span className="font-medium text-slate-700">{vi.book.category}:</span>{" "}
                <span className="text-slate-600">{book.category.name}</span>
              </p>
              {book.publisher && (
                <p>
                  <span className="font-medium text-slate-700">{vi.book.publisher}:</span>{" "}
                  <span className="text-slate-600">{book.publisher}</span>
                </p>
              )}
              {book.publishedYear && (
                <p>
                  <span className="font-medium text-slate-700">{vi.book.publishedYear}:</span>{" "}
                  <span className="text-slate-600">{book.publishedYear}</span>
                </p>
              )}
              {(book.classificationNumber || book.authorMark) && (
                <p>
                  <span className="font-medium text-slate-700">{vi.book.callNumber}:</span>{" "}
                  <span className="text-slate-600">
                    {[book.classificationNumber, book.authorMark].filter(Boolean).join(" ")}
                  </span>
                </p>
              )}
              {book.description && (
                <p>
                  <span className="font-medium text-slate-700">{vi.book.description}:</span>{" "}
                  <span className="text-slate-600">{book.description}</span>
                </p>
              )}
            </div>
          )}

          {isStaff && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-[#0f1c3a]">{vi.book.sectionBasicInfo}</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">{vi.book.title}</label>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{vi.book.author}</label>
                    <select
                      required
                      value={form.authorId}
                      onChange={(e) => setForm({ ...form, authorId: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    >
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
                      value={form.categoryId}
                      onChange={(e) => {
                        const cat = categories?.find((c) => c.id === e.target.value);
                        const shouldAutoFill = !form.classificationNumber && Boolean(cat?.ddcPrefix);
                        setForm({
                          ...form,
                          categoryId: e.target.value,
                          classificationNumber: shouldAutoFill ? cat!.ddcPrefix! : form.classificationNumber,
                        });
                      }}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    >
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{vi.book.classificationNumber}</label>
                    <input
                      value={form.classificationNumber}
                      onChange={(e) => setForm({ ...form, classificationNumber: e.target.value })}
                      placeholder={vi.book.classificationNumberPlaceholder}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{vi.book.authorMark}</label>
                    <input
                      value={form.authorMark}
                      onChange={(e) => setForm({ ...form, authorMark: e.target.value })}
                      placeholder={vi.book.authorMarkPlaceholder}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
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
                      onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{vi.book.publishedYear}</label>
                    <input
                      type="number"
                      value={form.publishedYear}
                      onChange={(e) => setForm({ ...form, publishedYear: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{vi.book.isbn}</label>
                    <input
                      value={form.isbn}
                      onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{vi.book.language}</label>
                    <input
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">{vi.book.description}</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-[#0f1c3a]">{vi.book.sectionCopiesLocation}</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">{vi.copy.location}</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder={book.copies.length > 1 ? vi.book.locationAppliesToAll : undefined}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button icon={Save} type="submit" disabled={updateBook.isPending}>
                  {vi.common.save}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            {vi.copy.title} ({book.availableCopies}/{book.totalCopies} {vi.book.availability})
          </h2>
          {isStaff && book.copies.length > 0 && (
            <div className="flex gap-2">
              <ButtonLink icon={Printer} variant="secondary" size="sm" href={`/sach/${params.id}/ma-vach`}>
                {vi.copy.printBarcodes}
              </ButtonLink>
              <ButtonLink icon={Printer} variant="secondary" size="sm" href={`/sach/${params.id}/nhan-gay`}>
                {vi.copy.printSpineLabels}
              </ButtonLink>
            </div>
          )}
        </div>

        {isStaff && (
        <form onSubmit={handleAddCopies} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600">{vi.copy.quantity}</label>
            <input
              type="number"
              min={1}
              max={50}
              value={newCopyQty}
              onChange={(e) => setNewCopyQty(e.target.value)}
              className="mt-1 w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">{vi.copy.location}</label>
            <input
              value={newCopyLocation}
              onChange={(e) => setNewCopyLocation(e.target.value)}
              className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <Button icon={Plus} size="sm" type="submit" disabled={addCopies.isPending}>
            {vi.copy.addCopies}
          </Button>
        </form>
        )}

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
              <tr>
                <th className="px-4 py-2">{vi.common.stt}</th>
                <th className="px-4 py-2">{vi.copy.barcode}</th>
                <th className="px-4 py-2">{vi.copy.status}</th>
                <th className="px-4 py-2">{vi.copy.location}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {book.copies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                    {vi.common.noData}
                  </td>
                </tr>
              )}
              {book.copies.map((copy, index) => (
                <tr key={copy.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{copy.barcode}</td>
                  <td className="px-4 py-2">
                    {isStaff ? (
                      <select
                        value={copy.status}
                        onChange={(e) => handleCopyStatusChange(copy.id, e.target.value as CopyStatus)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none"
                      >
                        {COPY_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {vi.copyStatus[status]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {vi.copyStatus[copy.status]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {isStaff ? (
                      <input
                        key={copy.id}
                        defaultValue={copy.location ?? ""}
                        onBlur={(e) => {
                          if (e.target.value !== (copy.location ?? "")) {
                            handleCopyLocationChange(copy.id, e.target.value);
                          }
                        }}
                        placeholder="—"
                        className="w-28 rounded-md border border-transparent px-2 py-1 text-sm hover:border-slate-300 focus:border-slate-500 focus:outline-none"
                      />
                    ) : (
                      copy.location || "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {canDelete && (
                      <Button icon={Trash2} variant="danger" size="sm" onClick={() => handleDeleteCopy(copy.id)}>
                        {vi.common.delete}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
