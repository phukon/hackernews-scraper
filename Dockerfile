FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache mysql-client && \
    npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src/schema ./src/schema

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    DB_HOST=localhost \
    DB_USER=admin \
    DB_NAME=hackernews \
    DB_PASSWORD=password

CMD pnpm run db:generate && pnpm db:migrate && node dist/index.js