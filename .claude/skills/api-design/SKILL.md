---
name: api-design
description: REST API design conventions for @repo/api. Use this whenever designing or implementing any API endpoint — GET, POST, PUT, PATCH, DELETE. Covers URL structure, response shapes, pagination, and error handling. Always apply this when writing controllers, returning lists of data, or handling errors in the NestJS API.
---

# API Design

The project follows REST API design conventions. All endpoints must be consistent in their URL structure, response shape, and error format.

## URL Conventions

```
GET    /resources          → list (paginated)
GET    /resources/:id      → single item
POST   /resources          → create
PATCH  /resources/:id      → partial update
DELETE /resources/:id      → delete
```

- Use **plural nouns** (`/campaigns`, `/recipients`, not `/campaign`)
- Use **kebab-case** for multi-word resources (`/campaign-recipients`)
- Nest only one level deep: `/campaigns/:id/recipients`, not deeper

## Pagination

All list endpoints must use `PaginationQuerySchema` for query params and `PaginatedResponseSchema` for the response. Both come from `@repo/schemas`.

```ts
import { PaginationQuerySchema, PaginatedResponseSchema, CampaignSchema } from '@repo/schemas'

// Query params accepted: ?page=1&limit=20
// Defaults: page=1, limit=20, max limit=100
```

### Controller example

```ts
import { Controller, Get, Query } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'
import { PaginationQuerySchema, type PaginationQuery } from '@repo/schemas'

@Controller('campaigns')
export class CampaignsController {
  @Get()
  findAll(@Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQuery) {
    return this.campaignsService.findAll(query)
  }
}
```

### Service example

```ts
async findAll(query: PaginationQuery) {
  const { page, limit } = query
  const offset = (page - 1) * limit

  const [data, [{ count }]] = await Promise.all([
    this.knex('campaigns').limit(limit).offset(offset),
    this.knex('campaigns').count('id as count'),
  ])

  const total = Number(count)

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
```

The return shape matches `PaginatedResponseSchema`:
```ts
{
  data: Campaign[],
  total: number,
  page: number,
  limit: number,
  totalPages: number,
}
```

## Error Responses

All error responses must conform to `ApiErrorSchema` from `@repo/schemas`:

```ts
// ApiErrorSchema shape:
{
  statusCode: number,
  message: string,
  error?: string,
  timestamp: string,   // ISO datetime
  path?: string,
}
```

Use NestJS built-in exceptions — they map to this shape automatically when combined with a global exception filter:

```ts
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'

// 404
throw new NotFoundException('Campaign not found')

// 400
throw new BadRequestException('Invalid status transition')

// 409
throw new ConflictException('Email already registered')
```

If you need a custom exception filter to enforce the exact `ApiErrorSchema` shape, implement `ExceptionFilter` and register it globally in `main.ts`.

## Status Codes

| Scenario | Code |
|---|---|
| Successful read | 200 |
| Successfully created | 201 |
| No content (delete) | 204 |
| Validation error | 400 |
| Unauthenticated | 401 |
| Forbidden | 403 |
| Not found | 404 |
| Conflict (duplicate) | 409 |
| Server error | 500 |

## Validation

Validation is handled globally by `ZodValidationPipe` (registered in `main.ts`). DTOs extend `createZodDto()` from `nestjs-zod` — no manual validation needed in controllers or services.

```ts
@Post()
create(@Body() dto: CreateCampaignDto) {
  // dto is already validated against CreateCampaignSchema
  return this.campaignsService.create(dto)
}
```
