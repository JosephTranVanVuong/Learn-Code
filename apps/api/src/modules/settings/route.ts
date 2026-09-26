import path from "node:path";
import type { FastifyInstance } from "fastify";
import {
  ADMIN_ROLES,
  RESTORE_CONFIRM_PHRASE,
  restoreConfirmInputSchema,
  sendTestEmailInputSchema,
  updateBackupSettingsInputSchema,
  updateBarcodeSettingsInputSchema,
  updateFineSettingsInputSchema,
  updateLibrarySettingsInputSchema,
} from "@thuvien/shared";
import { deleteLogoImageFile, isAllowedImageMime, saveLogoImage } from "../../lib/uploads";
import {
  createManualBackup,
  downloadBackupFile,
  getBackupSettings,
  getBarcodeSettings,
  getCurrentLogoUrl,
  getEmailStatus,
  getFineSettings,
  getLibrarySettings,
  isValidSqliteFile,
  listBackupHistory,
  removeBackupFile,
  restoreDatabaseFile,
  restoreFromBackup,
  sendTestEmail,
  setLibraryLogo,
  updateBackupSettings,
  updateBarcodeSettings,
  updateFineSettings,
  updateLibrarySettings,
} from "./service";

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  app.addHook("preHandler", app.requireRole(...ADMIN_ROLES));

  // --- Thông tin thư viện ---
  app.get("/library", async (_request, reply) => {
    return reply.send(await getLibrarySettings());
  });

  app.patch("/library", async (request, reply) => {
    const body = updateLibrarySettingsInputSchema.parse(request.body);
    return reply.send(await updateLibrarySettings(body));
  });

  app.post("/library/logo", async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ message: "Vui lòng chọn ảnh" });
    }
    if (!isAllowedImageMime(file.mimetype)) {
      return reply.code(400).send({ message: "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP" });
    }
    const buffer = await file.toBuffer();
    if (file.file.truncated) {
      return reply.code(400).send({ message: "Ảnh tối đa 5MB" });
    }
    const existingLogoUrl = await getCurrentLogoUrl();
    const url = await saveLogoImage(buffer, file.mimetype);
    await deleteLogoImageFile(existingLogoUrl);
    return reply.send(await setLibraryLogo(url));
  });

  app.delete("/library/logo", async (_request, reply) => {
    const existingLogoUrl = await getCurrentLogoUrl();
    await deleteLogoImageFile(existingLogoUrl);
    await setLibraryLogo(null);
    return reply.code(204).send();
  });

  // --- Mức phạt ---
  app.get("/fine", async (_request, reply) => {
    return reply.send(await getFineSettings());
  });

  app.patch("/fine", async (request, reply) => {
    const body = updateFineSettingsInputSchema.parse(request.body);
    return reply.send(await updateFineSettings(body.finePerDayVnd));
  });

  // --- Barcode ---
  app.get("/barcode", async (_request, reply) => {
    return reply.send(await getBarcodeSettings());
  });

  app.patch("/barcode", async (request, reply) => {
    const body = updateBarcodeSettingsInputSchema.parse(request.body);
    return reply.send(await updateBarcodeSettings(body));
  });

  // --- Email ---
  app.get("/email", async (_request, reply) => {
    return reply.send(getEmailStatus());
  });

  app.post("/email/test", async (request, reply) => {
    const body = sendTestEmailInputSchema.parse(request.body);
    const sent = await sendTestEmail(body.to);
    if (!sent) {
      return reply.code(409).send({ message: "Chưa cấu hình SMTP hoặc gửi email thất bại" });
    }
    return reply.send({ sent: true });
  });

  // --- Sao lưu / Khôi phục ---
  app.get("/backup-settings", async (_request, reply) => {
    return reply.send(await getBackupSettings());
  });

  app.patch("/backup-settings", async (request, reply) => {
    const body = updateBackupSettingsInputSchema.parse(request.body);
    return reply.send(await updateBackupSettings(body));
  });

  app.get("/backups", async (_request, reply) => {
    return reply.send(await listBackupHistory());
  });

  app.post("/backups", async (_request, reply) => {
    return reply.send(await createManualBackup());
  });

  app.get("/backups/:filename/download", async (request, reply) => {
    const { filename } = request.params as { filename: string };
    let buffer: Buffer;
    try {
      buffer = await downloadBackupFile(filename);
    } catch {
      return reply.code(404).send({ message: "Không tìm thấy file sao lưu" });
    }
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);
    return reply.type("application/octet-stream").send(buffer);
  });

  app.delete("/backups/:filename", async (request, reply) => {
    const { filename } = request.params as { filename: string };
    try {
      await removeBackupFile(filename);
    } catch {
      return reply.code(404).send({ message: "Không tìm thấy file sao lưu" });
    }
    return reply.code(204).send();
  });

  app.post("/backups/:filename/restore", async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const parsed = restoreConfirmInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: `Vui lòng gõ đúng "${RESTORE_CONFIRM_PHRASE}" để xác nhận` });
    }
    try {
      await restoreFromBackup(filename);
    } catch {
      return reply.code(404).send({ message: "Không tìm thấy file sao lưu" });
    }
    return reply.send({ success: true });
  });

  app.post("/restore", async (request, reply) => {
    const query = request.query as { confirm?: string };
    if (query.confirm !== RESTORE_CONFIRM_PHRASE) {
      return reply.code(400).send({ message: `Vui lòng gõ đúng "${RESTORE_CONFIRM_PHRASE}" để xác nhận` });
    }
    const file = await request.file({ limits: { fileSize: 200 * 1024 * 1024 } });
    if (!file) {
      return reply.code(400).send({ message: "Vui lòng chọn file sao lưu (.db)" });
    }
    if (path.extname(file.filename) !== ".db") {
      return reply.code(400).send({ message: "File không hợp lệ — vui lòng chọn file .db" });
    }
    const buffer = await file.toBuffer();
    if (!isValidSqliteFile(buffer)) {
      return reply.code(400).send({ message: "File không hợp lệ — không phải file cơ sở dữ liệu SQLite" });
    }

    await restoreDatabaseFile(buffer);
    return reply.send({ success: true });
  });
}
