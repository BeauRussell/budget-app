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
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run dev"]

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

# Copy all files from builder stage to keep it simple
COPY --from=builder /app ./

EXPOSE 3000

# Run migrations and start the server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]