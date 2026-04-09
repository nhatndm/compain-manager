# Delta: shared-packages

## Status
ADDED

## Purpose
Define the requirements and acceptance scenarios for all packages under `packages/` — the shared schemas, TypeScript config, ESLint config, and Prettier config consumed by both apps.

## Requirements

### Requirement: Single schema source of truth
The system SHALL provide a `@repo/schemas` package that is the only location where Zod schemas and their inferred TypeScript types are defined for data shared between frontend and backend.

#### Scenario: Backend consumes shared schema as a DTO
Given `@repo/schemas` exports `CreateUserSchema`
When a NestJS controller uses `createZodDto(CreateUserSchema)` to define its DTO
Then the DTO enforces the same shape as the Zod schema
And no separate type or interface is manually written in `apps/api`

#### Scenario: Frontend consumes shared schema as a form resolver
Given `@repo/schemas` exports `CreateUserSchema`
When a React form uses `zodResolver(CreateUserSchema)` from `@hookform/resolvers`
Then form validation enforces the same rules as the backend DTO
And the form field types are inferred from `z.infer<typeof CreateUserSchema>`

#### Scenario: Schema package has no app-specific dependencies
Given `@repo/schemas/package.json`
When a developer inspects its `dependencies`
Then the only runtime dependency is `zod`
And no NestJS, React, or Vite packages are listed

---

### Requirement: Shared TypeScript configuration
The system SHALL provide a `@repo/tsconfig` package with `base.json`, `react.json`, and `node.json` presets.

#### Scenario: All workspaces extend a shared tsconfig
Given any `tsconfig.json` in `apps/` or `packages/`
When it is opened
Then it contains an `"extends"` field pointing to the appropriate `@repo/tsconfig` preset
And it does not duplicate compiler options already defined in the preset

---

### Requirement: Shared linting and formatting configuration
The system SHALL provide `@repo/eslint-config` and `@repo/prettier-config` packages consumed by all workspaces.

#### Scenario: Lint rules are consistent across workspaces
Given any workspace runs `pnpm turbo lint`
Then no workspace defines conflicting or overriding ESLint rules that contradict `@repo/eslint-config`

#### Scenario: Formatting is identical across workspaces
Given a developer runs `prettier --check .` from the root
Then all files across all workspaces pass formatting checks using the shared Prettier config

---

### Requirement: Package build output
The system SHALL ensure `@repo/schemas` emits a compiled `dist/` with type declarations before any dependent workspace builds.

#### Scenario: Consumers resolve types without source compilation
Given `apps/web` imports `@repo/schemas`
When TypeScript resolves the import
Then it uses the `dist/` declaration files
And no `ts-node` or on-the-fly compilation is required at import time