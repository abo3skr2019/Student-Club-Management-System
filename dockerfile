# Stage 1: build and prune dev dependencies
FROM node:23-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm prune --prod

# Stage 2: runtime
FROM node:23-alpine AS runner
WORKDIR /usr/src/app
# Copy production node_modules and build artifacts
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/backend ./backend
COPY --from=builder /usr/src/app/frontend ./frontend
COPY --from=builder /usr/src/app/utils ./utils
COPY app.js ./

CMD ["node", "app.js"]