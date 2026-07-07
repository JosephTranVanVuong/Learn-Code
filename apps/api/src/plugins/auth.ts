import type { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import { env } from "../config/env";
import type { Role } from "@thuvien/shared";

export async function registerAuthPlugin(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: "15m" },
  });

  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ message: "Chưa xác thực hoặc token đã hết hạn" });
    }
  });

  app.decorate("requireRole", (...roles: Role[]) => {
    return async (request: Parameters<FastifyInstance["authenticate"]>[0], reply: Parameters<FastifyInstance["authenticate"]>[1]) => {
      const role = request.user?.role;
      if (!role || !roles.includes(role)) {
        reply.code(403).send({ message: "Bạn không có quyền truy cập chức năng này" });
      }
    };
  });
}
