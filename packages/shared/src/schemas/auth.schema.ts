import { z } from "zod";
import { ROLES } from "../constants";

export const unifiedLoginSchema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập email hoặc mã số độc giả"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type UnifiedLoginInput = z.infer<typeof unifiedLoginSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().optional(),
});
export type RefreshRequestInput = z.infer<typeof refreshRequestSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  role: z.enum(ROLES),
  fullName: z.string(),
  email: z.string().nullable().optional(),
  studentCode: z.string().nullable().optional(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  user: authUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
  })
  .strict();
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
