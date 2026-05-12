FROM node:22-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install && npx prisma generate

COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache openssl wget

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null; exec node dist/server/index.js"]
