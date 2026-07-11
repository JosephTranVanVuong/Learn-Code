FROM node:20-bookworm-slim

RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

WORKDIR /repo
COPY . .

# NEXT_PUBLIC_* phải có mặt LÚC BUILD (được đóng cứng vào bundle client),
# không phải lúc container khởi chạy — truyền qua build arg.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @thuvien/web build

ENV NODE_ENV=production
WORKDIR /repo/apps/web
EXPOSE 3000

CMD ["pnpm", "start"]
