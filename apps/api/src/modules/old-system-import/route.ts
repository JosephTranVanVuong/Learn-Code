import type { FastifyInstance } from "fastify";
import { ADMIN_ROLES, importOldSystemAccessInputSchema, STAFF_ROLES } from "@thuvien/shared";
import { readOldSystemAccessFile } from "./access-reader";
import { readOldSystemExcelBooks } from "./excel-reader";
import { importBooksFromOldSystem } from "./import-books";
import { importPatronsFromOldSystem } from "./import-patrons";
import { importLoansFromOldSystem } from "./import-loans";

export async function oldSystemImportRoutes(app: FastifyInstance) {
  // Đọc file .accdb trực tiếp trên máy chủ — chỉ QUAN_TRI (đọc file theo đường dẫn tùy ý, cần hạn chế quyền).
  app.post(
    "/access",
    { preHandler: [app.authenticate, app.requireRole(...ADMIN_ROLES)] },
    async (request, reply) => {
      const body = importOldSystemAccessInputSchema.parse(request.body);

      let data;
      try {
        data = await readOldSystemAccessFile(body.filePath);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không đọc được file Access";
        return reply.code(400).send({ message });
      }

      const books = body.importBooks ? await importBooksFromOldSystem(data.books) : null;
      const patrons = body.importPatrons ? await importPatronsFromOldSystem(data.patrons) : null;
      const loans = body.importLoans ? await importLoansFromOldSystem(data.loans) : null;

      return reply.send({ books, patrons, loans });
    },
  );

  // Nhập từ file Excel "Danh sách tổng quát tác phẩm" — chỉ có dữ liệu sách/mã vạch.
  app.post(
    "/excel",
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

      let rows;
      try {
        rows = readOldSystemExcelBooks(buffer);
      } catch (err) {
        const message = err instanceof Error ? err.message : "File không đúng định dạng";
        return reply.code(400).send({ message });
      }

      const result = await importBooksFromOldSystem(rows);
      return reply.send(result);
    },
  );
}
