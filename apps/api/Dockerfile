FROM node:20-alpine

RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests so pnpm can resolve the workspace graph
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/schemas/package.json        ./packages/schemas/
COPY packages/tsconfig/package.json       ./packages/tsconfig/
COPY packages/eslint-config/package.json  ./packages/eslint-config/
COPY packages/prettier-config/package.json ./packages/prettier-config/
COPY apps/api/package.json                ./apps/api/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build shared schemas so the API can import from @repo/schemas
RUN pnpm --filter @repo/schemas build

EXPOSE 3000

# Run migrations then start the API in dev mode (SWC, no compile step needed)
CMD ["sh", "-c", "pnpm --filter @repo/api db:migrate && pnpm --filter @repo/api dev"]
