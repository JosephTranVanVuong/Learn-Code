import type { FastifyInstance } from "fastify";
import {
  ADMIN_ROLES,
  createUserInputSchema,
  resetUserPasswordInputSchema,
  updateUserInputSchema,
  userQuerySchema,
} from "@thuvien/shared";
import { deleteAvatarImageFile, isAllowedImageMime, saveAvatarImage } from "../../lib/uploads";
import {
  createUser,
  deactivateUser,
  deleteUserPermanently,
  getUser,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserAvatar,
} from "./service";

export async function usersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  app.addHook("preHandler", app.requireRole(...ADMIN_ROLES));

  app.get("/", async (request, reply) => {
    const query = userQuerySchema.parse(request.query);
    return reply.send(await listUsers(query));
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await getUser(id);
    if (!user) {
      return reply.code(404).send({ message: "Không tìm thấy người dùng" });
    }
    return reply.send(user);
  });

  app.post("/", async (request, reply) => {
    const body = createUserInputSchema.parse(request.body);
    const result = await createUser(body);
    if (result === "duplicate") {
      return reply.code(409).send({ message: "Email này đã được sử dụng" });
    }
    return reply.code(201).send(result);
  });

  app.patch("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateUserInputSchema.parse(request.body);
    const user = await updateUser(id, body);
    if (!user) {
      return reply.code(404).send({ message: "Không tìm thấy người dùng" });
    }
    return reply.send(user);
  });

  app.patch("/:id/mat-khau", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = resetUserPasswordInputSchema.parse(request.body);
    const ok = await resetUserPassword(id, body);
    if (!ok) {
      return reply.code(404).send({ message: "Không tìm thấy người dùng" });
    }
    return reply.send({ success: true });
  });

  app.post("/:id/avatar", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await getUser(id);
    if (!existing) {
      return reply.code(404).send({ message: "Không tìm thấy người dùng" });
    }

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

    const url = await saveAvatarImage(buffer, file.mimetype);
    await deleteAvatarImageFile(existing.avatarUrl);
    const updated = await updateUserAvatar(id, url);
    return reply.send(updated);
  });

  app.delete("/:id/avatar", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await getUser(id);
    if (!existing) {
      return reply.code(404).send({ message: "Không tìm thấy người dùng" });
    }
    await deleteAvatarImageFile(existing.avatarUrl);
    const updated = await updateUserAvatar(id, null);
    return reply.send(updated);
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await deactivateUser(id, request.user.sub);
    if (result === "not_found") {
      return reply.code(404).send({ message: "Không tìm thấy người dùng" });
    }
    if (result === "self") {
      return reply.code(409).send({ message: "Không thể vô hiệu hóa chính tài khoản của bạn" });
    }
    return reply.code(204).send();
  });

  app.delete("/:id/permanent", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await getUser(id);
    const result = await deleteUserPermanently(id, request.user.sub);
    if (result === "not_found") {
      return reply.code(404).send({ message: "Không tìm thấy người dùng" });
    }
    if (result === "self") {
      return reply.code(409).send({ message: "Không thể xóa vĩnh viễn chính tài khoản của bạn" });
    }
    await deleteAvatarImageFile(existing?.avatarUrl);
    return reply.code(204).send();
  });
}
