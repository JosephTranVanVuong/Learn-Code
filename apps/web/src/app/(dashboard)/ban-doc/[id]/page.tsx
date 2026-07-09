"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ban, CircleCheck, KeyRound, Printer, Save, Trash2, Upload, UserCheck, UserX } from "lucide-react";
import { ApiError, DESTRUCTIVE_ROLES, vi } from "@thuvien/shared";
import { useAuth } from "@/lib/auth-context";
import { resolveAssetUrl } from "@/lib/asset-url";
import { Button, ButtonLink } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  useDeactivatePatron,
  useDeletePatronPermanently,
  usePatron,
  usePatronLoans,
  useRemovePatronAvatar,
  useResetPatronPassword,
  useUpdatePatron,
  useUploadPatronAvatar,
} from "@/hooks/use-patrons";
import { useFines, usePayFine, useWaiveFine } from "@/hooks/use-fines";
import { usePatronTypes } from "@/hooks/use-patron-types";

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export default function ChiTietChungSinhPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const canDelete = user ? DESTRUCTIVE_ROLES.includes(user.role) : false;
  const { data: patron, isLoading } = usePatron(params.id);
  const { data: patronTypes } = usePatronTypes();
  const { data: loans } = usePatronLoans(params.id);
  const { data: fines } = useFines({ patronId: params.id, page: 1, pageSize: 50 });
  const updatePatron = useUpdatePatron(params.id);
  const resetPassword = useResetPatronPassword(params.id);
  const deactivatePatron = useDeactivatePatron();
  const deletePatronPermanently = useDeletePatronPermanently();
  const uploadAvatar = useUploadPatronAvatar(params.id);
  const removeAvatar = useRemovePatronAvatar(params.id);
  const payFine = usePayFine();
  const waiveFine = useWaiveFine();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    fullName: string;
    className: string;
    phone: string;
    email: string;
    patronTypeId: string;
  } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (patron && !form) {
      setForm({
        fullName: patron.fullName,
        className: patron.className ?? "",
        phone: patron.phone ?? "",
        email: patron.email ?? "",
        patronTypeId: patron.patronTypeId ?? "",
      });
    }
  }, [patron, form]);

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
    setInfo(null);
    try {
      await updatePatron.mutateAsync({
        fullName: form.fullName,
        className: form.className || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        patronTypeId: form.patronTypeId || undefined,
      });
      setInfo(vi.common.save + " ✓");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  function openPasswordModal() {
    setNewPassword("");
    setPasswordError(null);
    setShowPasswordModal(true);
  }

  function closePasswordModal() {
    setShowPasswordModal(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    try {
      await resetPassword.mutateAsync({ password: newPassword });
      setShowPasswordModal(false);
      setInfo(vi.patron.resetPassword + " ✓");
    } catch (err) {
      setPasswordError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeactivate() {
    if (!confirm(vi.patron.deactivateConfirm)) return;
    setError(null);
    try {
      await deactivatePatron.mutateAsync(params.id);
      router.push("/ban-doc");
    } catch (err) {
      setError(extractMessage(err, vi.patron.deactivateBlocked));
    }
  }

  async function handleReactivate() {
    if (!confirm(vi.patron.reactivateConfirm)) return;
    setError(null);
    setInfo(null);
    try {
      await updatePatron.mutateAsync({ isActive: true });
      setInfo(vi.patron.reactivate + " ✓");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeletePermanently() {
    if (!confirm(vi.patron.deletePermanentlyConfirm)) return;
    setError(null);
    try {
      await deletePatronPermanently.mutateAsync(params.id);
      router.push("/ban-doc");
    } catch (err) {
      setError(extractMessage(err, vi.patron.deletePermanentlyBlocked));
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError(vi.patron.avatarInvalidType);
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError(vi.patron.avatarTooLarge);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadAvatar.mutateAsync(formData);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleRemoveAvatar() {
    if (!confirm(vi.patron.removeAvatarConfirm)) return;
    setError(null);
    try {
      await removeAvatar.mutateAsync();
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handlePayFine(id: string) {
    setError(null);
    if (!confirm(vi.fine.payConfirm)) return;
    try {
      await payFine.mutateAsync(id);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleWaiveFine(id: string) {
    setError(null);
    if (!confirm(vi.fine.waiveConfirm)) return;
    try {
      await waiveFine.mutateAsync(id);
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  if (isLoading || !form) {
    return <p className="text-sm text-slate-400">{vi.common.loading}</p>;
  }

  if (!patron) {
    return <p className="text-sm text-slate-400">{vi.common.noData}</p>;
  }

  return (
    <div>
      <Link href="/ban-doc" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          {vi.patron.editPatron} — <span className="font-mono text-base">{patron.studentCode}</span>
          {!patron.isActive && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-normal text-slate-500">
              {vi.patron.inactive}
            </span>
          )}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={KeyRound} variant="secondary" size="sm" onClick={openPasswordModal}>
            {vi.patron.resetPassword}
          </Button>
          <ButtonLink icon={Printer} variant="secondary" size="sm" href={`/ban-doc/${params.id}/the-thanh-vien`}>
            {vi.patron.printCard}
          </ButtonLink>
          {patron.isActive ? (
            canDelete && (
              <Button icon={UserX} variant="danger" size="sm" onClick={handleDeactivate}>
                {vi.patron.deactivate}
              </Button>
            )
          ) : (
            <Button
              icon={UserCheck}
              variant="success"
              size="sm"
              onClick={handleReactivate}
              disabled={updatePatron.isPending}
            >
              {vi.patron.reactivate}
            </Button>
          )}
          {canDelete && (
            <Button
              icon={Trash2}
              variant="danger"
              size="sm"
              onClick={handleDeletePermanently}
              disabled={deletePatronPermanently.isPending}
            >
              {vi.patron.deletePermanently}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6">
            {patron.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveAssetUrl(patron.avatarUrl) ?? undefined}
                alt={patron.fullName}
                className="aspect-[2/3] w-32 rounded-md border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] w-32 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">
                {vi.patron.noAvatar}
              </div>
            )}
            <p className="mt-3 text-sm font-medium text-slate-800">{patron.fullName}</p>
            <p className="text-xs text-slate-500">
              {patron.className || vi.patron.noPatronType}
              {patron.patronTypeName ? ` · ${patron.patronTypeName}` : ""}
            </p>
            <div className="mt-4 flex w-full flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                icon={Upload}
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
              >
                {patron.avatarUrl ? vi.patron.changeAvatar : vi.patron.uploadAvatar}
              </Button>
              {patron.avatarUrl && canDelete && (
                <Button
                  icon={Trash2}
                  variant="danger"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={removeAvatar.isPending}
                >
                  {vi.patron.removeAvatar}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">{vi.patron.fullName}</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{vi.patron.className}</label>
                <input
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{vi.patron.patronType}</label>
                <select
                  value={form.patronTypeId}
                  onChange={(e) => setForm({ ...form, patronTypeId: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{vi.patron.email}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button icon={Save} type="submit" disabled={updatePatron.isPending}>
                {vi.common.save}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-800">{vi.patron.loanHistory}</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
              <tr>
                <th className="px-4 py-2">{vi.common.stt}</th>
                <th className="px-4 py-2">{vi.book.title}</th>
                <th className="px-4 py-2">{vi.copy.barcode}</th>
                <th className="px-4 py-2">{vi.loan.borrowedAt}</th>
                <th className="px-4 py-2">{vi.loan.dueDate}</th>
                <th className="px-4 py-2">{vi.copy.status}</th>
              </tr>
            </thead>
            <tbody>
              {(!loans || loans.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                    {vi.loan.noActiveLoans}
                  </td>
                </tr>
              )}
              {loans?.map((loan, index) => (
                <tr key={loan.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                  <td className="px-4 py-2 text-slate-800">{loan.book.title}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{loan.copy.barcode}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {new Date(loan.borrowedAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {new Date(loan.dueDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        loan.status === "OVERDUE"
                          ? "bg-red-50 text-red-700"
                          : loan.status === "RETURNED"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {vi.loanStatus[loan.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-800">{vi.fine.title}</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-[#c9a24b] bg-[#f6efdd] text-left text-xs font-semibold uppercase tracking-wide text-[#0f1c3a]">
              <tr>
                <th className="px-4 py-2">{vi.common.stt}</th>
                <th className="px-4 py-2">{vi.book.title}</th>
                <th className="px-4 py-2">{vi.copy.barcode}</th>
                <th className="px-4 py-2">{vi.fine.reason}</th>
                <th className="px-4 py-2">{vi.fine.amount}</th>
                <th className="px-4 py-2">{vi.copy.status}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(!fines || fines.items.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                    {vi.fine.noFines}
                  </td>
                </tr>
              )}
              {fines?.items.map((fine, index) => (
                <tr key={fine.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                  <td className="px-4 py-2 text-slate-800">{fine.loan.book.title}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{fine.loan.copy.barcode}</td>
                  <td className="px-4 py-2 text-slate-600">{fine.reason}</td>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {fine.amount.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        fine.status === "UNPAID"
                          ? "bg-red-50 text-red-700"
                          : fine.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {vi.fineStatus[fine.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {fine.status === "UNPAID" && (
                      <div className="flex justify-end gap-2">
                        <Button icon={Ban} variant="ghost" size="sm" onClick={() => handleWaiveFine(fine.id)}>
                          {vi.fine.waive}
                        </Button>
                        <Button icon={CircleCheck} size="sm" onClick={() => handlePayFine(fine.id)}>
                          {vi.fine.pay}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showPasswordModal} onClose={closePasswordModal} title={vi.patron.resetPassword}>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.patron.password}</label>
            <input
              autoFocus
              type="text"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={vi.patron.password}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          {passwordError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={closePasswordModal}>
              {vi.common.cancel}
            </Button>
            <Button icon={KeyRound} type="submit" size="sm" disabled={resetPassword.isPending}>
              {vi.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
