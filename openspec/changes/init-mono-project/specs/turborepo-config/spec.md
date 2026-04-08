# Delta: turborepo-config

## Status
ADDED

## Purpose
Define the requirements and acceptance scenarios for Turborepo task orchestration — how tasks are ordered, cached, and run across the monorepo.

## Requirements

### Requirement: Correct task dependency ordering
The system SHALL use `"dependsOn": ["^build"]` so that a workspace's dependencies are always built before it.

#### Scenario: Schema package builds before apps
Given `apps/api` and `apps/web` both declare `@repo/schemas` as a workspace dependency
When `pnpm turbo build` is executed at the repo root
Then Turborepo runs `@repo/schemas#build` in the first wave
And `apps/api#build` and `apps/web#build` run in a subsequent wave

---

### Requirement: Development mode runs persistently
The system SHALL configure the `dev` task with `"cache": false` and `"persistent": true` so that `turbo dev` keeps all dev servers running simultaneously.

#### Scenario: Both dev servers start from one command
Given a developer runs `pnpm dev` from the root (which invokes `turbo dev`)
When Turborepo starts
Then `apps/api` dev server and `apps/web` dev server both start
And both remain running until the developer interrupts the process

---

### Requirement: Test tasks receive required environment variables
The system SHALL declare environment variables consumed by test tasks in `turbo.json` so they are included in the cache key.

#### Scenario: Tests are not incorrectly cached across environments
Given `DATABASE_URL` differs between local and CI environments
When `pnpm turbo test` runs in CI
Then Turborepo includes `DATABASE_URL` in the cache key for the `test` task
And a cached result from a different `DATABASE_URL` value is not used

---

### Requirement: Database migration task is never cached
The system SHALL configure `db:migrate` with `"cache": false` so migrations always run when explicitly invoked.

#### Scenario: Migration always executes
Given a developer runs `pnpm turbo db:migrate`
When Turborepo processes the task
Then Knex runs `migrate:latest` against the database regardless of prior runs
And no cache hit prevents the migration from executing

---

### Requirement: Build outputs are declared for caching
The system SHALL declare `dist/**` (and other build output directories) in the `outputs` field of the `build` task so Turborepo can restore them from cache.

#### Scenario: Cache restoration provides usable build artefacts
Given a previous `turbo build` produced `packages/schemas/dist/`
When the same inputs are present and `turbo build` runs again
Then Turborepo restores `dist/` from cache
And downstream workspaces can import from `@repo/schemas` without recompiling