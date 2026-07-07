"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, Save, Trash2, Upload, UserCheck, UserX } from "lucide-react";
import { ApiError, STAFF_ROLE_VALUES, vi } from "@thuvien/shared";
import { useAuth } from "@/lib/auth-context";
import { resolveAssetUrl } from "@/lib/asset-url";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  useDeactivateUser,
  useDeleteUserPermanently,
  useRemoveUserAvatar,
  useResetUserPassword,
  useUpdateUser,
  useUploadUserAvatar,
  useUser,
} from "@/hooks/use-users";

type StaffRole = (typeof STAFF_ROLE_VALUES)[number];

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export default function ChiTietNguoiDungPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { data: targetUser, isLoading } = useUser(params.id);
  const updateUser = useUpdateUser(params.id);
  const resetPassword = useResetUserPassword(params.id);
  const deactivateUser = useDeactivateUser();
  const deleteUserPermanently = useDeleteUserPermanently();
  const uploadAvatar = useUploadUserAvatar(params.id);
  const removeAvatar = useRemoveUserAvatar(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{ fullName: string; role: StaffRole } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (targetUser && !form) {
      setForm({ fullName: targetUser.fullName, role: targetUser.role });
    }
  }, [targetUser, form]);

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
      await updateUser.mutateAsync(form);
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
      setInfo(vi.user.resetPassword + " ✓");
    } catch (err) {
      setPasswordError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeactivate() {
    if (!confirm(vi.user.deactivateConfirm)) return;
    setError(null);
    try {
      await deactivateUser.mutateAsync(params.id);
      router.push("/nguoi-dung");
    } catch (err) {
      setError(extractMessage(err, vi.user.deactivateBlocked));
    }
  }

  async function handleReactivate() {
    if (!confirm(vi.user.reactivateConfirm)) return;
    setError(null);
    setInfo(null);
    try {
      await updateUser.mutateAsync({ isActive: true });
      setInfo(vi.user.reactivate + " ✓");
    } catch (err) {
      setError(extractMessage(err, vi.common.error));
    }
  }

  async function handleDeletePermanently() {
    if (!confirm(vi.user.deletePermanentlyConfirm)) return;
    setError(null);
    try {
      await deleteUserPermanently.mutateAsync(params.id);
      router.push("/nguoi-dung");
    } catch (err) {
      setError(extractMessage(err, vi.user.deletePermanentlyBlocked));
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

  if (isLoading || !form) {
    return <p className="text-sm text-slate-400">{vi.common.loading}</p>;
  }

  if (!targetUser) {
    return <p className="text-sm text-slate-400">{vi.common.noData}</p>;
  }

  const isSelf = currentUser?.id === targetUser.id;

  return (
    <div>
      <Link href="/nguoi-dung" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        {vi.common.back}
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          {vi.user.editUser}
          {!targetUser.isActive && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-normal text-slate-500">
              {vi.user.inactive}
            </span>
          )}
        </h1>
        {!isSelf && (
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={KeyRound} variant="secondary" size="sm" onClick={openPasswordModal}>
              {vi.user.resetPassword}
            </Button>
            {targetUser.isActive ? (
              <Button icon={UserX} variant="danger" size="sm" onClick={handleDeactivate}>
                {vi.user.deactivate}
              </Button>
            ) : (
              <Button icon={UserCheck} variant="success" size="sm" onClick={handleReactivate} disabled={updateUser.isPending}>
                {vi.user.reactivate}
              </Button>
            )}
            <Button
              icon={Trash2}
              variant="danger"
              size="sm"
              onClick={handleDeletePermanently}
              disabled={deleteUserPermanently.isPending}
            >
              {vi.user.deletePermanently}
            </Button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6">
            {targetUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveAssetUrl(targetUser.avatarUrl) ?? undefined}
                alt={targetUser.fullName}
                className="h-32 w-32 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">
                {vi.patron.noAvatar}
              </div>
            )}
            <p className="mt-3 text-sm font-medium text-slate-800">{targetUser.fullName}</p>
            <p className="text-xs text-slate-500">{vi.roles[targetUser.role]}</p>
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
                {targetUser.avatarUrl ? vi.patron.changeAvatar : vi.patron.uploadAvatar}
              </Button>
              {targetUser.avatarUrl && (
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
                <label className="block text-sm font-medium text-slate-700">{vi.user.fullName}</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{vi.user.email}</label>
                <input
                  disabled
                  value={targetUser.email}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{vi.user.role}</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  {STAFF_ROLE_VALUES.map((role) => (
                    <option key={role} value={role}>
                      {vi.roles[role]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button icon={Save} type="submit" disabled={updateUser.isPending}>
                {vi.common.save}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Modal open={showPasswordModal} onClose={closePasswordModal} title={vi.user.resetPassword}>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">{vi.user.password}</label>
            <input
              autoFocus
              type="text"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={vi.user.password}
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
