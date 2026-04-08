# Design: Mono-Repo Project Initialisation

## Approach

Scaffold the monorepo top-down: workspace tooling first, shared packages second, apps last. This ordering ensures that by the time `apps/web` and `apps/api` are configured they can immediately resolve their `@repo/*` dependencies without circular or missing package errors.

---

## Repository Structure

```
mono-repo-project/
├── apps/
│   ├── web/                        # React + Vite frontend
│   │   ├── src/
│   │   │   ├── app/               # Root App component, providers
│   │   │   ├── assets/
│   │   │   ├── components/        # Shared UI components
│   │   │   ├── features/          # Feature-sliced modules
│   │   │   │   └── <feature>/
│   │   │   │       ├── api.ts     # React Query hooks
│   │   │   │       ├── slice.ts   # RTK slice
│   │   │   │       ├── types.ts   # Local types (extends @repo/schemas)
│   │   │   │       └── components/
│   │   │   ├── lib/               # Utility helpers
│   │   │   ├── routes/            # React Router route definitions
│   │   │   └── store/             # Redux store configuration
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json          # extends @repo/tsconfig/react.json
│   │   └── package.json
│   │
│   └── api/                        # NestJS backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── database/          # Knex connection + migrations
│       │   │   ├── knex.config.ts
│       │   │   └── migrations/
│       │   └── modules/           # Feature NestJS modules
│       │       └── <module>/
│       │           ├── <module>.module.ts
│       │           ├── <module>.controller.ts
│       │           ├── <module>.service.ts
│       │           └── dto/       # Derived via createZodDto(@repo/schemas)
│       ├── tsconfig.json          # extends @repo/tsconfig/node.json
│       └── package.json
│
├── packages/
│   ├── schemas/                    # @repo/schemas
│   │   ├── src/
│   │   │   ├── index.ts           # Barrel export
│   │   │   ├── common.ts          # Pagination, error, id helpers
│   │   │   └── <domain>.ts        # Per-domain schemas
│   │   ├── tsconfig.json          # extends @repo/tsconfig/base.json
│   │   └── package.json
│   │
│   ├── tsconfig/                   # @repo/tsconfig
│   │   ├── base.json
│   │   ├── react.json
│   │   ├── node.json
│   │   └── package.json
│   │
│   ├── eslint-config/              # @repo/eslint-config
│   │   ├── index.js               # base config
│   │   ├── react.js
│   │   ├── node.js
│   │   └── package.json
│   │
│   └── prettier-config/            # @repo/prettier-config
│       ├── index.js
│       └── package.json
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json                    # root — scripts only, no deps
├── .env.example
└── .gitignore
```

---

## Package Dependency Graph

```
apps/web  ──────────────────► @repo/schemas
apps/web  ──────────────────► @repo/tsconfig
apps/web  ──────────────────► @repo/eslint-config
apps/web  ──────────────────► @repo/prettier-config

apps/api  ──────────────────► @repo/schemas
apps/api  ──────────────────► @repo/tsconfig
apps/api  ──────────────────► @repo/eslint-config
apps/api  ──────────────────► @repo/prettier-config

@repo/schemas ──────────────► @repo/tsconfig
@repo/eslint-config ────────► (external: eslint, typescript-eslint)
@repo/prettier-config ──────► (external: prettier)
```

No circular dependencies. `@repo/schemas` has zero runtime deps beyond `zod`.

---

## Turborepo Pipeline (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "env": ["DATABASE_URL", "JWT_SECRET"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

`^build` means a package's `build` must complete before any dependent workspace runs its own task. This guarantees `@repo/schemas` is compiled before `apps/web` or `apps/api` build.

---

## Shared Schema Pattern (`@repo/schemas`)

Schemas are plain Zod objects. TypeScript types are inferred — never written by hand.

```ts
// packages/schemas/src/user.ts
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
})

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true })
export const UpdateUserSchema = CreateUserSchema.partial()

export type User = z.infer<typeof UserSchema>
export type CreateUserDto = z.infer<typeof CreateUserSchema>
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>
```

**Backend usage (NestJS + nestjs-zod):**
```ts
import { createZodDto } from 'nestjs-zod'
import { CreateUserSchema } from '@repo/schemas'

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
```

**Frontend usage (React Query + React Hook Form):**
```ts
import { CreateUserSchema, type CreateUserDto } from '@repo/schemas'

const form = useForm<CreateUserDto>({
  resolver: zodResolver(CreateUserSchema),
})
```

---

## State Architecture (`apps/web`)

| Concern | Tool | Location |
|---|---|---|
| Server state (API data) | React Query | `features/<name>/api.ts` |
| Global UI state | Redux Toolkit | `store/` + `features/<name>/slice.ts` |
| URL / navigation state | React Router | `routes/` |
| Form state | React Hook Form + Zod | per-component |
| Schema validation | `@repo/schemas` | imported everywhere |

React Query is the primary data layer. RTK is reserved for global client-only state (auth session, UI preferences, notification queue). No duplication of server data into Redux.

---

## Database Layer (`apps/api`)

Knex is used as a query builder only — no ORM. Migrations live in `src/database/migrations/`. A `KnexModule` provides a typed Knex instance injectable across NestJS services.

```ts
// apps/api/src/database/knex.config.ts
import type { Knex } from 'knex'

export const knexConfig: Knex.Config = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
}
```

---

## Environment Variables

| Variable | App | Description |
|---|---|---|
| `DATABASE_URL` | api | PostgreSQL connection string |
| `JWT_SECRET` | api | JWT signing secret |
| `JWT_EXPIRES_IN` | api | Token expiry (e.g. `7d`) |
| `PORT` | api | HTTP port (default `3000`) |
| `VITE_API_URL` | web | Base URL for API calls |

Secrets never live in `packages/`. Each app has its own `.env` and `.env.example`.

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Package manager | pnpm | Native workspace support, strict dependency hoisting, fast installs |
| Build orchestration | Turborepo | Remote cache, parallel task execution, `^build` dependency graph |
| Schema sharing | Zod in `@repo/schemas` | Single source of truth; both nestjs-zod and zodResolver consume Zod schemas natively |
| Query builder | Knex (no ORM) | Predictable SQL, easy migrations, no magic — appropriate for a scaffold baseline |
| Frontend data | React Query over RTK Query | Better cache invalidation UX; RTK reserved for pure client state |