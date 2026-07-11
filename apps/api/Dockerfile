# Chạy production bằng tsx (không dùng "tsc build" — @thuvien/shared và
# @thuvien/database là TypeScript nguồn thuần, tsc không transpile chúng
# nên "node dist/server.js" không resolve nổi các package workspace này).
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

WORKDIR /repo

# Copy toàn bộ monorepo (đơn giản, ưu tiên chắc chắn chạy đúng hơn là tối ưu
# cache layer — dự án nhỏ, rebuild không thường xuyên).
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @thuvien/database db:generate

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "pnpm --filter @thuvien/database db:migrate:deploy && pnpm --filter @thuvien/api start"]
