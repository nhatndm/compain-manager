---
name: api-architecture
description: Guide for the @repo/api NestJS project structure. Use this whenever creating a new module, controller, service, entity, or schema in the API — or when adding a new feature, resource, or domain to the backend. Also applies when someone asks how to structure code in the API, where to put files, or how models/schemas should be defined.
---

# API Architecture

The API lives at `apps/api/` and follows NestJS conventions with a feature-module layout.

## Folder Structure

```
apps/api/src/
├── main.ts                        # Bootstrap — Express, global pipes
├── app.module.ts                  # Root module — imports all feature modules
├── database/
│   ├── knex.config.ts             # Knex config (default export, used by CLI + module)
│   ├── knex.module.ts             # Global KnexModule — provides KNEX_CONNECTION token
│   └── migrations/                # Knex migration files (timestamped)
└── modules/
    └── <feature>/                 # One folder per domain (users, campaigns, recipients…)
        ├── <feature>.module.ts
        ├── <feature>.controller.ts
        ├── <feature>.service.ts
        ├── dto/
        │   └── create-<feature>.dto.ts   # Extends createZodDto() from nestjs-zod
        └── decorators/
            └── <decorator>.decorator.ts  # Param decorators, method decorators
```

## Creating a New Module

Follow this sequence every time you add a new domain (e.g. `campaigns`):

### 1. Define the schema in `packages/schemas`

Schemas are the single source of truth shared between the API and the web app. **Never define Zod schemas inside `apps/api`.**

```ts
// packages/schemas/src/campaign.ts
import { z } from 'zod'

export const CampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  // ...
})

export const CreateCampaignSchema = CampaignSchema.omit({ id: true, createdAt: true })
export type Campaign = z.infer<typeof CampaignSchema>
export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>
```

Then re-export from `packages/schemas/src/index.ts`:
```ts
export * from './campaign'
```

Then **build** the schemas package so the API can consume the compiled output:
```bash
pnpm --filter @repo/schemas build
```

> `@repo/schemas` uses `tsup` to produce both CJS (`dist/index.js`) and ESM (`dist/index.mjs`). Always rebuild after changing schemas.

### 2. Create the DTO in the API

```ts
// apps/api/src/modules/campaigns/dto/create-campaign.dto.ts
import { createZodDto } from 'nestjs-zod'
import { CreateCampaignSchema } from '@repo/schemas'

export class CreateCampaignDto extends createZodDto(CreateCampaignSchema) {}
```

### 3. Create the service

Inject `KNEX_CONNECTION` for database access. Never instantiate services manually.

```ts
// apps/api/src/modules/campaigns/campaigns.service.ts
import { Injectable, Inject } from '@nestjs/common'
import { Knex } from 'knex'
import { KNEX_CONNECTION } from '../../database/knex.module'

@Injectable()
export class CampaignsService {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}
}
```

### 4. Create the controller

```ts
// apps/api/src/modules/campaigns/campaigns.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common'
import { CampaignsService } from './campaigns.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}
}
```

### 5. Create the module and register it

```ts
// apps/api/src/modules/campaigns/campaigns.module.ts
import { Module } from '@nestjs/common'
import { CampaignsController } from './campaigns.controller'
import { CampaignsService } from './campaigns.service'

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
```

Then add it to `app.module.ts`:
```ts
imports: [KnexModule, CampaignsModule],
```

### 6. Add a migration

Migration files live in `apps/api/src/database/migrations/` and are named with a timestamp prefix:

```ts
// 20260409_create_campaigns.ts
import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('campaigns', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    // ...
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('campaigns')
}
```

Run with:
```bash
pnpm --filter @repo/api db:migrate
```

## Key Rules

- **All Zod schemas live in `packages/schemas`**, never inside `apps/api`
- **Always rebuild `@repo/schemas`** after any schema change before using in the API
- **No import cycles** — modules import from `@repo/schemas`, not from each other's internals
- **`KnexModule` is global** — no need to import it in feature modules, just inject `KNEX_CONNECTION`
- **No `.js` extensions** in imports — the project uses `moduleResolution: Node16` with CommonJS
- **All decorators go in `decorators/`** — every custom param decorator, method decorator, or composed decorator lives in the feature's `decorators/` folder, named `<name>.decorator.ts`. Example: `modules/auth/decorators/current-user.decorator.ts`
