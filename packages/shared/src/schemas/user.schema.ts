import { z } from "zod";
import { paginationQuerySchema } from "./common.schema";
import { STAFF_ROLE_VALUES } from "../constants";

export const userSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  role: z.enum(STAFF_ROLE_VALUES),
  isActive: z.boolean(),
  avatarUrl: z.string().nullable(),
});
export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.enum(STAFF_ROLE_VALUES),
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  fullName: z.string().min(1).optional(),
  role: z.enum(STAFF_ROLE_VALUES).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const resetUserPasswordInputSchema = z.object({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordInputSchema>;

export const userQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});
export type UserQuery = z.infer<typeof userQuerySchema>;
