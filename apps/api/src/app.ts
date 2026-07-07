import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { ZodError } from "zod";
import { env } from "./config/env";
import { UPLOADS_ROOT } from "./lib/uploads";
import { registerAuthPlugin } from "./plugins/auth";
import { authRoutes } from "./modules/auth/route";
import { categoriesRoutes } from "./modules/categories/route";
import { authorsRoutes } from "./modules/authors/route";
import { booksRoutes } from "./modules/books/route";
import { copiesRoutes } from "./modules/copies/route";
import { patronsRoutes } from "./modules/patrons/route";
import { loansRoutes } from "./modules/loans/route";
import { finesRoutes } from "./modules/fines/route";
import { reportsRoutes } from "./modules/reports/route";
import { notificationsRoutes } from "./modules/notifications/route";
import { usersRoutes } from "./modules/users/route";
import { patronTypesRoutes } from "./modules/patron-types/route";
import { settingsRoutes } from "./modules/settings/route";
import { dataManagementRoutes } from "./modules/data-management/route";

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty" } }
        : true,
  });

  await app.register(cors, {
    origin: [env.WEB_ORIGIN],
    credentials: true,
  });
  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(swagger, {
    openapi: {
      info: { title: "Thư viện CVPL API", version: "0.1.0" },
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(fastifyStatic, { root: UPLOADS_ROOT, prefix: "/uploads/" });

  await registerAuthPlugin(app);

  app.setErrorHandler((error: FastifyError | ZodError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: "Dữ liệu không hợp lệ", issues: error.issues });
    }
    request.log.error(error);
    const statusCode = typeof error.statusCode === "number" ? error.statusCode : 500;
    return reply.code(statusCode).send({ message: error.message || "Đã xảy ra lỗi máy chủ" });
  });

  app.get("/", async () => ({
    name: "Thư viện CVPL API",
    status: "ok",
    docs: "/docs",
    health: "/health",
  }));

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(categoriesRoutes, { prefix: "/api/v1/categories" });
  await app.register(authorsRoutes, { prefix: "/api/v1/authors" });
  await app.register(booksRoutes, { prefix: "/api/v1/books" });
  await app.register(copiesRoutes, { prefix: "/api/v1/copies" });
  await app.register(patronsRoutes, { prefix: "/api/v1/patrons" });
  await app.register(loansRoutes, { prefix: "/api/v1/loans" });
  await app.register(finesRoutes, { prefix: "/api/v1/fines" });
  await app.register(reportsRoutes, { prefix: "/api/v1/reports" });
  await app.register(notificationsRoutes, { prefix: "/api/v1/notifications" });
  await app.register(usersRoutes, { prefix: "/api/v1/users" });
  await app.register(patronTypesRoutes, { prefix: "/api/v1/patron-types" });
  await app.register(settingsRoutes, { prefix: "/api/v1/settings" });
  await app.register(dataManagementRoutes, { prefix: "/api/v1/data-management" });

  return app;
}
