import type { FastifyInstance } from "fastify";
import {
  createLoanInputSchema,
  createLoansBatchInputSchema,
  loanQuerySchema,
  renewLoanInputSchema,
  returnByBarcodeInputSchema,
  STAFF_ROLES,
} from "@thuvien/shared";
import {
  createLoan,
  createLoansBatch,
  getLoan,
  listLoans,
  listOverdueLoans,
  renewLoan,
  returnLoan,
  returnLoanByBarcode,
} from "./service";

const CREATE_LOAN_ERRORS = {
  copy_not_found: { status: 404, message: "Không tìm thấy bản sao" },
  copy_not_available: { status: 409, message: "Bản sao này hiện không có sẵn để cho mượn" },
  patron_not_found: { status: 404, message: "Không tìm thấy độc giả" },
  patron_inactive: { status: 409, message: "Độc giả này đã bị vô hiệu hóa" },
  loan_limit_reached: { status: 409, message: "Độc giả đã mượn đủ số sách tối đa cho phép" },
} satisfies Record<string, { status: number; message: string }>;

const CREATE_LOANS_BATCH_ERRORS = {
  patron_not_found: { status: 404, message: "Không tìm thấy độc giả" },
  patron_inactive: { status: 409, message: "Độc giả này đã bị vô hiệu hóa" },
} satisfies Record<string, { status: number; message: string }>;

const RETURN_LOAN_ERRORS = {
  not_found: { status: 404, message: "Không tìm thấy lượt mượn" },
  already_returned: { status: 409, message: "Sách này đã được trả trước đó" },
} satisfies Record<string, { status: number; message: string }>;

const RETURN_BY_BARCODE_ERRORS = {
  copy_not_found: { status: 404, message: "Không tìm thấy bản sao với mã vạch này" },
  no_active_loan: { status: 404, message: "Bản sao này hiện không có lượt mượn nào đang hoạt động" },
} satisfies Record<string, { status: number; message: string }>;

const RENEW_LOAN_ERRORS = {
  not_found: { status: 404, message: "Không tìm thấy lượt mượn" },
  already_returned: { status: 409, message: "Sách này đã được trả, không thể gia hạn" },
  overdue: { status: 409, message: "Sách đã quá hạn, không thể gia hạn" },
  renew_limit_reached: { status: 409, message: "Đã hết số lần gia hạn cho phép" },
  invalid_date: { status: 400, message: "Ngày gia hạn phải sau hạn trả hiện tại" },
} satisfies Record<string, { status: number; message: string }>;

export async function loansRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] }, async (request, reply) => {
    const query = loanQuerySchema.parse(request.query);
    return reply.send(await listLoans(query));
  });

  app.get(
    "/overdue",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (_request, reply) => {
      return reply.send(await listOverdueLoans());
    },
  );

  app.get("/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const loan = await getLoan(id);
    if (!loan) {
      return reply.code(404).send({ message: "Không tìm thấy lượt mượn" });
    }
    const isOwner = request.user.role === "CHUNG_SINH" && request.user.sub === loan.patronId;
    if (!STAFF_ROLES.includes(request.user.role) && !isOwner) {
      return reply.code(403).send({ message: "Bạn không có quyền xem lượt mượn này" });
    }
    return reply.send(loan);
  });

  app.post(
    "/",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = createLoanInputSchema.parse(request.body);
      const result = await createLoan(body);
      if (!result.ok) {
        const err = CREATE_LOAN_ERRORS[result.reason];
        return reply.code(err.status).send({ message: err.message });
      }
      return reply.code(201).send(result.loan);
    },
  );

  app.post(
    "/batch",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = createLoansBatchInputSchema.parse(request.body);
      const result = await createLoansBatch(body);
      if (!result.ok) {
        if (result.reason === "loan_limit_exceeded") {
          const remaining = Math.max(0, result.maxActiveLoans - result.currentActiveLoans);
          return reply.code(409).send({
            message: `Độc giả chỉ được mượn tối đa ${result.maxActiveLoans} cuốn (đang mượn ${result.currentActiveLoans}, còn được mượn thêm ${remaining} cuốn)`,
            maxActiveLoans: result.maxActiveLoans,
            currentActiveLoans: result.currentActiveLoans,
          });
        }
        if (result.reason === "copies_unavailable") {
          return reply.code(409).send({
            message: "Một số sách trong giỏ hiện không có sẵn để cho mượn",
            unavailableCopyIds: result.unavailableCopyIds,
          });
        }
        const err = CREATE_LOANS_BATCH_ERRORS[result.reason];
        return reply.code(err.status).send({ message: err.message });
      }
      return reply.code(201).send({ loans: result.loans });
    },
  );

  app.post(
    "/:id/return",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await returnLoan(id);
      if (!result.ok) {
        const err = RETURN_LOAN_ERRORS[result.reason];
        return reply.code(err.status).send({ message: err.message });
      }
      return reply.send(result.loan);
    },
  );

  app.post(
    "/return-by-barcode",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const body = returnByBarcodeInputSchema.parse(request.body);
      const result = await returnLoanByBarcode(body.barcode);
      if (!result.ok) {
        const err = RETURN_BY_BARCODE_ERRORS[result.reason];
        return reply.code(err.status).send({ message: err.message });
      }
      return reply.send(result.loan);
    },
  );

  app.post(
    "/:id/renew",
    { preHandler: [app.authenticate, app.requireRole(...STAFF_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = renewLoanInputSchema.parse(request.body);
      const result = await renewLoan(id, new Date(body.newDueDate));
      if (!result.ok) {
        const err = RENEW_LOAN_ERRORS[result.reason];
        return reply.code(err.status).send({ message: err.message });
      }
      return reply.send(result.loan);
    },
  );
}
