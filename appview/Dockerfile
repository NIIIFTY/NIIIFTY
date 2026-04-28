FROM oven/bun:1 as builder
WORKDIR /app

# Copy package.json and lockfile (using pnpm lockfile to match the monorepo)
# But since this is a monorepo, maybe we just copy the appview files.
# For simplicity, we can just install dependencies within the container using bun.
COPY package.json ./
RUN bun install

# Copy source code
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production

# Run the app
CMD ["bun", "run", "dist/index.js"]
