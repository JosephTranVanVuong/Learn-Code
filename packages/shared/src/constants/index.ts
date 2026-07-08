export const ROLES = ["QUAN_TRI", "THU_THU", "CONG_TAC_VIEN", "CHUNG_SINH"] as const;
export type Role = (typeof ROLES)[number];

/** Vai trò nhân viên (không phải độc giả) — dùng để nhận diện "isStaff" ở frontend. */
export const STAFF_ROLES: readonly Role[] = ["QUAN_TRI", "THU_THU", "CONG_TAC_VIEN"] as const;

/** Vai trò được phép thực hiện các hành động xóa/vô hiệu hóa dữ liệu (và các thay đổi cài đặt nhạy cảm). */
export const DESTRUCTIVE_ROLES: readonly Role[] = ["QUAN_TRI", "THU_THU"] as const;

/** Chỉ Quản trị viên mới được quản lý tài khoản người dùng (nhân viên). */
export const ADMIN_ROLES: readonly Role[] = ["QUAN_TRI"] as const;

/** Các vai trò hợp lệ cho tài khoản trong bảng User (nhân viên) — dùng làm nguồn cho zod enum. */
export const STAFF_ROLE_VALUES = ["QUAN_TRI", "THU_THU", "CONG_TAC_VIEN"] as const;

export const COPY_STATUSES = [
  "AVAILABLE",
  "BORROWED",
  "LOST",
  "DAMAGED",
  "WITHDRAWN",
] as const;
export type CopyStatus = (typeof COPY_STATUSES)[number];

export const LOAN_STATUSES = ["ACTIVE", "RETURNED", "OVERDUE"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const FINE_STATUSES = ["UNPAID", "PAID", "WAIVED"] as const;
export type FineStatus = (typeof FINE_STATUSES)[number];

export const ACCESS_TOKEN_TTL_MINUTES = 15;
export const REFRESH_TOKEN_TTL_DAYS = 30;

/** Cụm từ bắt buộc phải gõ đúng để xác nhận khôi phục dữ liệu (thao tác không thể hoàn tác). */
export const RESTORE_CONFIRM_PHRASE = "XÁC NHẬN";
