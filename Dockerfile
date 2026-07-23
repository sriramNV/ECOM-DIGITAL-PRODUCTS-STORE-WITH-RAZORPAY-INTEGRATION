FROM node:20-alpine
RUN npm install -g pnpm@9.15.9
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/web/prisma ./apps/web/prisma/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter web exec prisma generate

COPY . .
RUN pnpm build

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["pnpm", "start"]
