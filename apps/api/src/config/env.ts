import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().min(10),
  COOKIE_SECRET: z.string().min(10),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Thư viện ĐCV Phaolô Lê Bảo Tịnh <no-reply@thuvien.local>"),
});

export const env = envSchema.parse(process.env);
