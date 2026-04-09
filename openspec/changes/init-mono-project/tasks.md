# Tasks: Mono-Repo Project Initialisation

## Milestone 1 — Workspace Scaffold

- [x] 1.1 Create root `package.json` with `name`, `private: true`, and root-level scripts (`dev`, `build`, `lint`, `test`)
- [x] 1.2 Create `pnpm-workspace.yaml` declaring `apps/*` and `packages/*` globs
- [x] 1.3 Create `turbo.json` with `build`, `lint`, `test`, `dev`, and `db:migrate` task definitions and correct `^build` dependency ordering
- [x] 1.4 Create root `.gitignore` covering `node_modules`, `dist`, `.turbo`, `.env`, and build outputs
- [x] 1.5 Create root `.env.example` documenting all required environment variables
- [x] 1.6 Run `pnpm install` from root and verify workspace symlinks resolve

---

## Milestone 2 — Shared Tooling Packages

- [x] 2.1 Scaffold `packages/tsconfig` with `base.json`, `react.json`, and `node.json`; publish as `@repo/tsconfig`
- [x] 2.2 Scaffold `packages/eslint-config` with `index.js` (base), `react.js`, and `node.js` configs; publish as `@repo/eslint-config`
- [x] 2.3 Scaffold `packages/prettier-config` with `index.js`; publish as `@repo/prettier-config`
- [x] 2.4 Verify each tooling package has a correct `package.json` with `exports` field and no extraneous runtime deps

---

## Milestone 3 — Shared Schemas Package

- [x] 3.1 Scaffold `packages/schemas` with `package.json` as `@repo/schemas`; add `zod` as the only runtime dependency
- [x] 3.2 Add `packages/schemas/tsconfig.json` extending `@repo/tsconfig/base.json`
- [x] 3.3 Create `src/common.ts` with reusable primitives: `UuidSchema`, `PaginationQuerySchema`, `PaginatedResponseSchema`, `ApiErrorSchema`
- [x] 3.4 Create `src/index.ts` barrel export
- [x] 3.5 Configure `package.json` `"main"`, `"types"`, and `"exports"` to point at compiled `dist/`
- [x] 3.6 Add `build` script using `tsc --project tsconfig.json`
- [x] 3.7 Verify `pnpm --filter @repo/schemas build` succeeds and `dist/` is emitted

---

## Milestone 4 — Backend App (`apps/api`)

- [x] 4.1 Scaffold NestJS app with `@nestjs/cli` inside `apps/api`; remove default files not needed
- [x] 4.2 Add `package.json` with correct name `@repo/api` and workspace dep on `@repo/schemas`
- [x] 4.3 Add `tsconfig.json` extending `@repo/tsconfig/node.json`
- [x] 4.4 Install dependencies: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-fastify`, `nestjs-zod`, `knex`, `pg`, `zod`
- [x] 4.5 Install dev dependencies: `@types/node`, `jest`, `ts-jest`, `@nestjs/testing`
- [x] 4.6 Create `src/database/knex.config.ts` with PostgreSQL connection from `DATABASE_URL`
- [x] 4.7 Create `KnexModule` as a global NestJS module providing an injectable Knex instance
- [x] 4.8 Create `src/database/migrations/` directory and add an initial schema migration (e.g. `20260408_initial.ts`)
- [x] 4.9 Wire `ZodValidationPipe` globally in `main.ts` via `useGlobalPipes`
- [x] 4.10 Add `db:migrate` npm script calling `knex migrate:latest`
- [x] 4.11 Verify `pnpm --filter @repo/api dev` starts without errors

---

## Milestone 5 — Frontend App (`apps/web`)

- [x] 5.1 Scaffold React + Vite app inside `apps/web` using `pnpm create vite` with `react-ts` template
- [x] 5.2 Add `package.json` name `@repo/web` and workspace dep on `@repo/schemas`
- [x] 5.3 Add `tsconfig.json` extending `@repo/tsconfig/react.json`
- [x] 5.4 Install dependencies: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@reduxjs/toolkit`, `react-redux`, `zod`, `@hookform/resolvers`
- [x] 5.5 Install dev dependencies: `tailwindcss`, `@tailwindcss/vite`, `vite`, `vitest`, `@testing-library/react`
- [x] 5.6 Configure TailwindCSS: add `tailwind.config.ts` and import in `src/index.css`
- [x] 5.7 Create `src/store/index.ts` with Redux store and `Provider` wired in `src/app/App.tsx`
- [x] 5.8 Create `src/lib/queryClient.ts` with `QueryClient` config and `QueryClientProvider` wired in `App.tsx`
- [x] 5.9 Create `src/routes/index.tsx` with `createBrowserRouter` and at least a root `"/"` route
- [x] 5.10 Configure `vite.config.ts` with `VITE_API_URL` env var proxy for local dev
- [x] 5.11 Verify `pnpm --filter @repo/web dev` starts and loads in the browser without errors

---

## Milestone 6 — Integration & Validation

- [x] 6.1 Import `UserSchema` from `@repo/schemas` in both `apps/api` (as a DTO) and `apps/web` (as a form resolver) to validate the shared schema pipeline end-to-end
- [x] 6.2 Run `pnpm turbo build` from root and confirm all packages and apps build in the correct order with no errors
- [x] 6.3 Run `pnpm turbo lint` from root and confirm no lint errors across all workspaces
- [x] 6.4 Run `pnpm turbo test` from root and confirm unit test suites pass in both apps
- [x] 6.5 Confirm Turborepo cache hits on a second `turbo build` run (cache must not be empty)
- [x] 6.6 Update root `README.md` with setup instructions: prerequisites, `pnpm install`, `pnpm dev`, env vars, and migration commands