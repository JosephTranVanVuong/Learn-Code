import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { unifiedLoginSchema, refreshRequestSchema, changePasswordSchema } from "@thuvien/shared";
import { loginUnified, refreshSession, getMe, changeOwnPassword } from "./service";
import { revokeRefreshToken } from "../../lib/refresh-token";

const REFRESH_COOKIE = "refreshToken";
const isProd = process.env.NODE_ENV === "production";

function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function isMobile(request: FastifyRequest): boolean {
  return request.headers["x-client-platform"] === "mobile";
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request, reply) => {
    const body = unifiedLoginSchema.parse(request.body);
    const result = await loginUnified(app, body.identifier, body.password);
    if (!result) {
      return reply.code(401).send({ message: "Email/mã số hoặc mật khẩu không đúng" });
    }
    setRefreshCookie(reply, result.refreshToken);
    return reply.send({
      accessToken: result.accessToken,
      user: result.user,
      ...(isMobile(request) ? { refreshToken: result.refreshToken } : {}),
    });
  });

  app.post("/refresh", async (request, reply) => {
    const parsedBody = refreshRequestSchema.safeParse(request.body ?? {});
    const rawToken =
      (request.cookies?.[REFRESH_COOKIE] as string | undefined) ??
      (parsedBody.success ? parsedBody.data.refreshToken : undefined);

    if (!rawToken) {
      return reply.code(401).send({ message: "Thiếu refresh token" });
    }

    const result = await refreshSession(app, rawToken);
    if (!result) {
      reply.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
      return reply.code(401).send({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }

    setRefreshCookie(reply, result.refreshToken);
    return reply.send({
      accessToken: result.accessToken,
      user: result.user,
      ...(isMobile(request) ? { refreshToken: result.refreshToken } : {}),
    });
  });

  app.post("/logout", async (request, reply) => {
    const bodyToken = (request.body as { refreshToken?: string } | undefined)?.refreshToken;
    const rawToken = (request.cookies?.[REFRESH_COOKIE] as string | undefined) ?? bodyToken;
    if (rawToken) {
      await revokeRefreshToken(rawToken);
    }
    reply.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
    return reply.send({ success: true });
  });

  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const me = await getMe(request.user.role, request.user.sub);
    if (!me) {
      return reply.code(404).send({ message: "Không tìm thấy người dùng" });
    }
    return reply.send(me);
  });

  app.post("/change-password", { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = changePasswordSchema.parse(request.body);
    const result = await changeOwnPassword(request.user.role, request.user.sub, body.currentPassword, body.newPassword);
    if (result === "not_found") {
      return reply.code(404).send({ message: "Không tìm thấy tài khoản" });
    }
    if (result === "invalid_current_password") {
      return reply.code(401).send({ message: "Mật khẩu hiện tại không đúng" });
    }
    return reply.send({ success: true });
  });
}
