FROM oven/bun:1 AS base
WORKDIR /app

# ---- Development stage ----
FROM base AS development
# Copy configuration files
COPY package.json bun.lock* ./
# Install ALL dependencies
RUN bun install
# Copy the rest of the source code (filtered by .dockerignore)
COPY . .
# Set the environment variable to ensure Prisma works with Bun/Next.js properly
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
# Generate Prisma Client
RUN bunx prisma generate

ENV NODE_ENV=development

EXPOSE 3000
CMD ["sh", "-c", "bunx prisma@5.22.0 migrate deploy && bun run dev"]

# ---- Build stage ----
FROM base AS builder
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx prisma generate
RUN bun run build

# ---- Production stage ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone build and necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Run migrations and start the server using the standalone build
# We use bun to run the standalone server.js
# Pinning prisma version to match package.json to avoid auto-update to v7
CMD ["sh", "-c", "bunx prisma@5.22.0 migrate deploy && bun server.js"]
