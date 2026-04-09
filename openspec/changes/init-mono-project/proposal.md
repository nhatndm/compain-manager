# Proposal: Mono-Repo Project Initialisation

## Why

Starting a new full-stack application as separate repositories creates friction: shared types get duplicated, validation logic drifts between frontend and backend, tooling configs diverge, and cross-cutting changes require coordinating multiple PRs. A Turborepo monorepo solves all of this by placing the web app, API server, and shared packages in a single versioned workspace with unified tooling and a shared build cache.

The specific pain points this change eliminates:

- **Schema drift** — Zod schemas defined separately in the frontend and backend quickly diverge, leading to runtime mismatches between what the API sends and what the UI expects.
- **Duplicated types** — TypeScript interfaces get copy-pasted across repos and fall out of sync.
- **Slow CI** — Without remote caching, every CI run rebuilds everything from scratch.
- **Inconsistent tooling** — ESLint rules, Prettier config, and TypeScript settings differ between projects, causing noisy diffs and developer confusion.

## What Changes

### New: `apps/web`
A React 18 + TypeScript frontend built with Vite. Uses TailwindCSS for styling, React Router for navigation, Redux Toolkit for global state, React Query for server state, and Zod for form/runtime validation. Imports shared schemas from `@repo/schemas`.

### New: `apps/api`
A NestJS backend with TypeScript. Uses Knex as the SQL query builder against PostgreSQL, and `nestjs-zod` to derive NestJS DTOs directly from Zod schemas. Imports shared schemas from `@repo/schemas`.

### New: `packages/schemas` (`@repo/schemas`)
The single source of truth for all data shapes shared between frontend and backend. Exports:
- Zod schemas (request bodies, response shapes, query params)
- Inferred TypeScript types
- Shared enums and constants

### New: `packages/tsconfig` (`@repo/tsconfig`)
Base `tsconfig.json` presets (`base.json`, `react.json`, `node.json`) extended by each app and package.

### New: `packages/eslint-config` (`@repo/eslint-config`)
Shared ESLint configuration for React and Node environments, extended by each app.

### New: `packages/prettier-config` (`@repo/prettier-config`)
Single Prettier config consumed by all workspaces.

### New: Turborepo configuration (`turbo.json`)
Defines the task pipeline: `build` → `lint` → `test` with correct dependency ordering and remote cache configuration.

### New: `pnpm-workspace.yaml`
Declares the workspace glob patterns for pnpm to discover all apps and packages.

## Impact

- **Affected apps:** `apps/web`, `apps/api` (both new)
- **Affected packages:** `packages/schemas`, `packages/tsconfig`, `packages/eslint-config`, `packages/prettier-config` (all new)
- **CI/CD:** Pipeline must be updated to run `turbo build` / `turbo test` from the monorepo root
- **Environment:** Each app requires its own `.env` file; secrets must not be placed in shared packages
- **Dependencies:** pnpm ≥ 9, Node.js ≥ 20 LTS, Turborepo ≥ 2