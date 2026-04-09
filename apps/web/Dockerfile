FROM node:20-alpine

RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/schemas/package.json        ./packages/schemas/
COPY packages/tsconfig/package.json       ./packages/tsconfig/
COPY packages/eslint-config/package.json  ./packages/eslint-config/
COPY packages/prettier-config/package.json ./packages/prettier-config/
COPY apps/web/package.json                ./apps/web/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build shared schemas
RUN pnpm --filter @repo/schemas build

EXPOSE 5173

# --host exposes Vite on 0.0.0.0 so it's reachable outside the container
CMD ["pnpm", "--filter", "@repo/web", "dev", "--", "--host"]
