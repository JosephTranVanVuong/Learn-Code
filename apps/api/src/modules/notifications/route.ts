import type { FastifyInstance } from "fastify";
import { DESTRUCTIVE_ROLES, STAFF_ROLES, updateNotificationSettingsInputSchema } from "@thuvien/shared";
import {
  getNotificationSettings,
  listDueSoonLoans,
  listOverdueForNotify,
  sendDueSoonReminders,
  sendOverdueNotices,
  updateNotificationSettings,
} from "./service";

export async function notificationsRoutes(app: FastifyInstance) {
  app.get(
    "/settings",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (_request, reply) => {
      const settings = await getNotificationSettings();
      return reply.send(settings);
    },
  );

  app.patch(
    "/settings",
    { preHandler: [app.authenticate, app.requireRole(...DESTRUCTIVE_ROLES)] },
    async (request, reply) => {
      const body = updateNotificationSettingsInputSchema.parse(request.body);
      const settings = await updateNotificationSettings(body.autoSendEnabled);
      return reply.send(settings);
    },
  );

  app.get(
    "/due-soon",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (_request, reply) => {
      const items = await listDueSoonLoans();
      return reply.send(items);
    },
  );

  app.get(
    "/overdue",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (_request, reply) => {
      const items = await listOverdueForNotify();
      return reply.send(items);
    },
  );

  app.post(
    "/due-soon/send",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (_request, reply) => {
      const result = await sendDueSoonReminders();
      return reply.send(result);
    },
  );

  app.post(
    "/overdue/send",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (_request, reply) => {
      const result = await sendOverdueNotices();
      return reply.send(result);
    },
  );
}
