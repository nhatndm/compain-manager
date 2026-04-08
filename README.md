# Compain Manager

A full-stack monorepo built with Turborepo, featuring a NestJS API backend and a React + Vite frontend, sharing Zod schemas between them.

## Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | React 18, Vite 6, TailwindCSS, Redux Toolkit, React Query |
| Backend | NestJS 10, Fastify, Knex, PostgreSQL |
| Shared | Zod schemas (`@repo/schemas`) |
| Tooling | TypeScript, ESLint, Prettier |

## Prerequisites

- **Node.js** ≥ 20 LTS
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **PostgreSQL** ≥ 14 (for the API)

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file and fill in your values
cp .env.example apps/api/.env
cp .env.example apps/web/.env
```

Edit `apps/api/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/compain_manager
JWT_SECRET=your-secret-key
PORT=3000
```

Edit `apps/web/.env`:
```env
VITE_API_URL=http://localhost:3000
```

## Development

```bash
# Start all apps in parallel (API on :3000, web on :5173)
pnpm dev

# Or run individually
pnpm --filter @repo/api dev
pnpm --filter @repo/web dev
```

## Build

```bash
# Build all packages and apps (respects dependency order)
pnpm build

# Turborepo caches build outputs — subsequent builds are instant on unchanged code
pnpm build  # → FULL TURBO on second run
```

## Database Migrations

```bash
# Run pending migrations
pnpm --filter @repo/api db:migrate

# Or via turbo
pnpm turbo db:migrate
```

## Testing & Linting

```bash
pnpm test   # Run all test suites
pnpm lint   # Lint all workspaces
```

## Project Structure

```
compain-manager/
├── apps/
│   ├── api/          # NestJS backend (@repo/api)
│   └── web/          # React + Vite frontend (@repo/web)
├── packages/
│   ├── schemas/      # Shared Zod schemas (@repo/schemas)
│   ├── tsconfig/     # Shared TypeScript configs (@repo/tsconfig)
│   ├── eslint-config/ # Shared ESLint config (@repo/eslint-config)
│   └── prettier-config/ # Shared Prettier config (@repo/prettier-config)
├── turbo.json        # Turborepo pipeline
├── pnpm-workspace.yaml
└── .env.example      # Document all required env vars
```

## Environment Variables

| Variable | App | Description |
|---|---|---|
| `DATABASE_URL` | api | PostgreSQL connection string |
| `JWT_SECRET` | api | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | api | Token expiry (e.g. `7d`) |
| `PORT` | api | HTTP port (default `3000`) |
| `VITE_API_URL` | web | Base URL for API calls |
