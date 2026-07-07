import type { FastifyInstance } from "fastify";
import { reportsLimitQuerySchema, reportsPeriodQuerySchema, STAFF_ROLES } from "@thuvien/shared";
import {
  getLoansByPeriod,
  getMostBorrowedBooks,
  getOverdueSummary,
  getOverview,
  getPatronActivity,
} from "./service";

export async function reportsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  app.addHook("preHandler", app.requireRole(...STAFF_ROLES));

  app.get("/overview", async (_request, reply) => {
    return reply.send(await getOverview());
  });

  app.get("/most-borrowed", async (request, reply) => {
    const { limit } = reportsLimitQuerySchema.parse(request.query);
    return reply.send(await getMostBorrowedBooks(limit));
  });

  app.get("/overdue-summary", async (_request, reply) => {
    return reply.send(await getOverdueSummary());
  });

  app.get("/loans-by-period", async (request, reply) => {
    const { days } = reportsPeriodQuerySchema.parse(request.query);
    return reply.send(await getLoansByPeriod(days));
  });

  app.get("/patron-activity", async (request, reply) => {
    const { limit } = reportsLimitQuerySchema.parse(request.query);
    return reply.send(await getPatronActivity(limit));
  });
}
