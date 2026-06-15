# 멍플래너 프로덕션 이미지 (Next.js standalone)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# 쓰기 가능한 데이터 디렉터리(볼륨 마운트 권장)
ENV DATA_DIR=/data
RUN mkdir -p /data && addgroup -S app && adduser -S app -G app && chown -R app:app /data
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER app
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "server.js"]
