# Delta: monorepo-scaffold

## Status
ADDED

## Purpose
Define the requirements and acceptance scenarios for the root workspace scaffold — the files and configuration that make the repository a valid Turborepo pnpm monorepo.

## Requirements

### Requirement: Workspace declaration
The system SHALL declare all apps and packages as pnpm workspace members via `pnpm-workspace.yaml`.

#### Scenario: All workspaces are discovered
Given a developer runs `pnpm install` from the repository root
When pnpm resolves the workspace
Then all paths matching `apps/*` and `packages/*` are linked as workspace packages
And no workspace package produces an unresolved dependency error

---

### Requirement: Root package configuration
The system SHALL have a root `package.json` marked `"private": true` with no production dependencies.

#### Scenario: Root is not accidentally published
Given the root `package.json`
When a developer inspects it
Then `"private": true` is set
And there are no entries in `"dependencies"` or `"devDependencies"` beyond workspace tooling

---

### Requirement: Task pipeline definition
The system SHALL define a `turbo.json` that encodes the `build → lint → test` dependency chain using the `^build` convention.

#### Scenario: Packages build before dependent apps
Given `@repo/schemas` is a dependency of `apps/api`
When `pnpm turbo build` is run
Then `@repo/schemas#build` completes before `apps/api#build` starts

#### Scenario: Cache is used on unchanged workspaces
Given a successful `pnpm turbo build` has been run
When `pnpm turbo build` is run again with no source changes
Then Turborepo reports cache hits for all tasks
And no task is re-executed

---

### Requirement: Environment variable documentation
The system SHALL provide a `.env.example` at the repository root listing all required variables.

#### Scenario: Developer setup is self-documenting
Given a developer clones the repository
When they open `.env.example`
Then every variable required to run `apps/api` and `apps/web` locally is listed with a description comment