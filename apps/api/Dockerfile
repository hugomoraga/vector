# ─── Stage 1: Install + Build ───────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json turbo.json tsconfig.base.json ./

# Copy package.json files for workspace resolution
COPY apps/api/package.json apps/api/
COPY apps/api/tsconfig.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/config/package.json packages/config/

# Install all dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY packages/ packages/
COPY apps/api/src/ apps/api/src/

# Build API (tsc compiles to dist/)
RUN npm run build --workspace=@vector/api

# ─── Stage 2: Production ───────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy root workspace files
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/config/package.json packages/config/

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts --workspace=@vector/api

# Copy built output + internal packages (needed at runtime)
COPY --from=builder /app/apps/api/dist/ apps/api/dist/
COPY packages/ packages/

EXPOSE 8080

ENV PORT=8080

CMD ["node", "apps/api/dist/index.js"]