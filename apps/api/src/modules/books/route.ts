import type { FastifyInstance } from "fastify";
import {
  bookQuerySchema,
  createBookInputSchema,
  createCopiesInputSchema,
  DESTRUCTIVE_ROLES,
  exportBarcodesBulkInputSchema,
  exportSpineLabelsBulkInputSchema,
  STAFF_ROLES,
  updateBookCopiesLocationInputSchema,
  updateBookInputSchema,
} from "@thuvien/shared";
import {
  createBook,
  deleteBook,
  getBarcodeExportSummary,
  getBook,
  getSpineLabelExportSummary,
  listBooks,
  updateBook,
  updateBookCover,
} from "./service";
import {
  addCopies,
  exportBarcodesBulkForBooks,
  exportSpineLabelsBulkForBooks,
  listCopiesForBook,
  updateAllCopiesLocationForBook,
} from "../copies/service";
import { deleteCoverImageFile, isAllowedImageMime, saveCoverImage } from "../../lib/uploads";
import { generateImportTemplate, importBooksFromExcel } from "./import";
import { exportBooksToExcel } from "./export";

export async function booksRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const query = bookQuerySchema.parse(request.query);
    const result = await listBooks(query);
    return reply.send(result);
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const book = await getBook(id);
    if (!book) {
      return reply.code(404).send({ message: "Không tìm thấy sách" });
    }
    return reply.send(book);
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = createBookInputSchema.parse(request.body);
      const book = await createBook(body);
      return reply.code(201).send(book);
    },
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateBookInputSchema.parse(request.body);
      const book = await updateBook(id, body);
      if (!book) {
        return reply.code(404).send({ message: "Không tìm thấy sách" });
      }
      return reply.send(book);
    },
  );

  app.patch(
    "/:id/copies-location",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateBookCopiesLocationInputSchema.parse(request.body);
      const existing = await getBook(id);
      if (!existing) {
        return reply.code(404).send({ message: "Không tìm thấy sách" });
      }
      await updateAllCopiesLocationForBook(id, body.location);
      const updated = await getBook(id);
      return reply.send(updated);
    },
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, app.requireRole(...DESTRUCTIVE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const ok = await deleteBook(id);
      if (!ok) {
        return reply.code(404).send({ message: "Không tìm thấy sách" });
      }
      return reply.code(204).send();
    },
  );

  app.get("/:bookId/copies", async (request, reply) => {
    const { bookId } = request.params as { bookId: string };
    const copies = await listCopiesForBook(bookId);
    return reply.send(copies);
  });

  app.post(
    "/:bookId/copies",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { bookId } = request.params as { bookId: string };
      const body = createCopiesInputSchema.parse(request.body);
      const copies = await addCopies(bookId, body);
      if (!copies) {
        return reply.code(404).send({ message: "Không tìm thấy sách" });
      }
      return reply.code(201).send(copies);
    },
  );

  app.post(
    "/:id/cover",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await getBook(id);
      if (!existing) {
        return reply.code(404).send({ message: "Không tìm thấy sách" });
      }

      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ message: "Vui lòng chọn ảnh bìa" });
      }
      if (!isAllowedImageMime(file.mimetype)) {
        return reply.code(400).send({ message: "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP" });
      }

      const buffer = await file.toBuffer();
      if (file.file.truncated) {
        return reply.code(400).send({ message: "Ảnh bìa tối đa 5MB" });
      }

      const url = await saveCoverImage(buffer, file.mimetype);
      await deleteCoverImageFile(existing.coverImageUrl);
      const updated = await updateBookCover(id, url);
      return reply.send(updated);
    },
  );

  app.delete(
    "/:id/cover",
    { preHandler: [app.authenticate, app.requireRole(...DESTRUCTIVE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const existing = await getBook(id);
      if (!existing) {
        return reply.code(404).send({ message: "Không tìm thấy sách" });
      }
      await deleteCoverImageFile(existing.coverImageUrl);
      const updated = await updateBookCover(id, null);
      return reply.send(updated);
    },
  );

  app.get(
    "/import/template",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (_request, reply) => {
      const buffer = generateImportTemplate();
      reply.header("Content-Disposition", 'attachment; filename="mau-nhap-sach.xlsx"');
      return reply
        .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .send(buffer);
    },
  );

  app.post(
    "/import",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ message: "Vui lòng chọn file Excel" });
      }
      const hasValidExt = [".xlsx", ".xls"].some((ext) => file.filename.toLowerCase().endsWith(ext));
      if (!hasValidExt) {
        return reply.code(400).send({ message: "Chỉ chấp nhận file .xlsx hoặc .xls" });
      }
      const buffer = await file.toBuffer();
      const result = await importBooksFromExcel(buffer);
      return reply.send(result);
    },
  );

  app.get(
    "/export",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (_request, reply) => {
      const buffer = await exportBooksToExcel();
      reply.header("Content-Disposition", 'attachment; filename="danh-sach-sach.xlsx"');
      return reply
        .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .send(buffer);
    },
  );

  app.get(
    "/barcode-export-summary",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { search, categoryId } = request.query as { search?: string; categoryId?: string };
      const summary = await getBarcodeExportSummary({ search, categoryId });
      return reply.send(summary);
    },
  );

  app.post(
    "/export-barcodes-bulk",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = exportBarcodesBulkInputSchema.parse(request.body);
      const buffer = await exportBarcodesBulkForBooks(body.bookIds, body.onlyUnprinted);
      if (!buffer) {
        return reply.code(404).send({ message: "Không có bản sao nào phù hợp để xuất" });
      }
      reply.header("Content-Disposition", 'attachment; filename="nhan-ma-vach-hang-loat.docx"');
      return reply
        .type("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        .send(buffer);
    },
  );

  app.get(
    "/spine-label-export-summary",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { search, categoryId } = request.query as { search?: string; categoryId?: string };
      const summary = await getSpineLabelExportSummary({ search, categoryId });
      return reply.send(summary);
    },
  );

  app.post(
    "/export-spine-labels-bulk",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = exportSpineLabelsBulkInputSchema.parse(request.body);
      const buffer = await exportSpineLabelsBulkForBooks(body.bookIds, body.onlyUnprinted);
      if (!buffer) {
        return reply.code(404).send({ message: "Không có bản sao nào phù hợp để xuất" });
      }
      reply.header("Content-Disposition", 'attachment; filename="nhan-gay-hang-loat.docx"');
      return reply
        .type("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        .send(buffer);
    },
  );
}
