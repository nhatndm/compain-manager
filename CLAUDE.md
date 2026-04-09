# Campaign Manager — Project Guide

## Monorepo Layout

```
/
├── apps/
│   ├── api/          # NestJS REST API (@repo/api)
│   └── web/          # React SPA (@repo/web)
├── packages/
│   └── schemas/      # Shared Zod schemas + TypeScript types (@repo/schemas)
├── package.json      # Root — Turborepo + pnpm workspace
└── CLAUDE.md
```

**Package manager:** pnpm 9  
**Build orchestrator:** Turborepo  
**Node requirement:** ≥ 20

### Common scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start API + web in parallel (Turborepo) |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all test suites |
| `pnpm --filter @repo/api db:migrate` | Run pending Knex migrations |
| `pnpm --filter @repo/schemas build` | Rebuild shared schemas (required after any schema change) |

---

## `packages/schemas` — Shared Types

The **single source of truth** for data shapes across API and web. Never define Zod schemas inside `apps/api` or `apps/web`.

```
packages/schemas/src/
├── common.ts            # PaginationQuerySchema, PaginatedResponseSchema, ApiErrorSchema
├── auth.ts              # SignupSchema, LoginSchema, AuthUserSchema, MeResponseSchema
├── campaign.ts          # CampaignSchema, CreateCampaignSchema, CampaignStatsSchema, ...
├── recipient.ts         # RecipientSchema, CreateRecipientSchema
├── campaign-recipient.ts # CampaignRecipientSchema, CampaignRecipientItemSchema, ...
└── index.ts             # Re-exports everything
```

Built with `tsup` to produce both CJS (`dist/index.js`) and ESM (`dist/index.mjs`).

**Rule:** After any schema change, run `pnpm --filter @repo/schemas build` before using updated types in either app.

---

## `apps/api` — NestJS API

### Bootstrap (`main.ts`)

Three globals are registered at startup:

| Global | Purpose |
|---|---|
| `ZodValidationPipe` | Validates all `@Body()` and `@Query()` DTOs against their Zod schema |
| `HttpExceptionFilter` | Catches all exceptions and returns `ApiErrorSchema`-shaped JSON |
| `cookieParser` | Parses `access_token` cookie for JWT extraction |

### Folder structure

```
apps/api/src/
├── main.ts
├── app.module.ts                   # Root module — imports all feature modules
├── common/
│   ├── dto/
│   │   └── pagination-query.dto.ts # Shared PaginationQueryDto (extends PaginationQuerySchema)
│   └── filters/
│       └── http-exception.filter.ts
├── database/
│   ├── knex.config.ts              # Knex config (reads DATABASE_URL env var)
│   ├── knex.module.ts              # Global KnexModule — provides KNEX_CONNECTION token
│   └── migrations/                 # Timestamped migration files
└── modules/
    ├── auth/
    └── campaigns/
```

### Database

- **Driver:** PostgreSQL via Knex
- **Connection:** `DATABASE_URL` env var (default: `postgresql://localhost:5432/campaign_manager`)
- **Migrations:** `apps/api/src/database/migrations/` — timestamped, run with `pnpm --filter @repo/api db:migrate`
- **KnexModule** is `@Global()` — inject `KNEX_CONNECTION` in any service without importing KnexModule in the feature module

### Schema (tables)

```
users
  id uuid PK
  email string UNIQUE
  name string
  password_hash string
  created_at timestamp

campaigns
  id uuid PK
  name string
  subject string
  body text
  status enum(draft, scheduled, sent)  DEFAULT draft
  scheduled_at timestamp NULLABLE
  created_by uuid FK → users.id CASCADE DELETE
  created_at / updated_at timestamps

recipients
  id uuid PK
  email string UNIQUE
  name string
  created_at timestamp

campaign_recipients  (junction)
  campaign_id uuid FK → campaigns.id CASCADE DELETE
  recipient_id uuid FK → recipients.id CASCADE DELETE
  tracking_token string UNIQUE
  sent_at timestamp NULLABLE
  opened_at timestamp NULLABLE
  status enum(pending, sent, failed)  DEFAULT pending
  PK: (campaign_id, recipient_id)
```

### Adding a new feature module

1. Define/update schema in `packages/schemas/src/` → rebuild schemas
2. Create DTO in `apps/api/src/modules/<feature>/dto/` extending `createZodDto()`
3. Create service injecting `KNEX_CONNECTION`
4. Create controller applying `@Auth()` at class level for protected routes
5. Create module registering controller + service
6. Import module in `app.module.ts`
7. Add migration if new tables are needed

### DTOs

DTOs extend `createZodDto()` from `nestjs-zod` — validation is automatic via the global `ZodValidationPipe`.

```ts
// Pagination query (reuse this DTO for any paginated list endpoint)
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

@Get()
findAll(@Query() query: PaginationQueryDto) { ... }
```

---

## Auth module

### Flow

```
POST /auth/register   → hash password, insert user, return MeResponse
POST /auth/login      → verify password, sign JWT, set HttpOnly cookie (access_token, 7d)
POST /auth/logout     → clear access_token cookie
GET  /auth/me         → decode cookie, return { id, email, name }
```

### JWT

- Extracted from the `access_token` **HttpOnly cookie** (not Authorization header)
- Validated by `JwtStrategy` (passport-jwt) → attaches `{ id }` to `request.user`
- Secret: `JWT_SECRET` env var (default: `"changeme"` — override in production)

### Protecting routes

```ts
// Protect an entire controller
@Controller('campaigns')
@Auth()
export class CampaignsController { ... }

// Opt a single route out of auth (e.g. public tracking pixel)
@Get('open/:tracking_token')
@Public()
markOpened() { ... }
```

`@Auth()` is a composed decorator in `modules/auth/decorators/auth.decorator.ts` that applies `@UseGuards(JwtAuthGuard)`.  
`@Public()` sets `IS_PUBLIC_KEY` metadata; `JwtAuthGuard` reads it to skip validation.  
`@CurrentUser()` param decorator extracts `request.user` as `AuthUser`.

### Ownership checks

Every service method that touches a single resource must verify ownership:

```ts
private async findOwnedCampaign(id: string, userId: string): Promise<CampaignRow> {
  const campaign = await this.knex('campaigns').where('id', id).first()
  if (!campaign) throw new NotFoundException(CAMPAIGN_ERRORS.NOT_FOUND)
  if (campaign.created_by !== userId) throw new ForbiddenException(CAMPAIGN_ERRORS.FORBIDDEN)
  return campaign
}
```

---

## Campaigns module

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/campaigns` | required | Paginated list for current user |
| POST | `/campaigns` | required | Create campaign + upsert recipients |
| GET | `/campaigns/:id` | required | Campaign detail with stats |
| PATCH | `/campaigns/:id` | required | Update (draft only) |
| DELETE | `/campaigns/:id` | required | Delete (draft/scheduled only) |
| POST | `/campaigns/:id/schedule` | required | Schedule for future send |
| POST | `/campaigns/:id/send` | required | Send immediately |
| GET | `/campaigns/:id/recipients` | required | Paginated recipient list for campaign |
| GET | `/campaigns/:id/stats` | required | Aggregated delivery stats |
| GET | `/campaigns/open/:tracking_token` | public | Record first email open |

### Campaign status machine

Allowed transitions (`campaigns.transitions.ts`):

```
draft  → schedule → scheduled
draft  → send     → sent
scheduled → send  → sent

update: draft only (guard — no status change)
delete: draft or scheduled only (guard)
```

`assertTransition(currentStatus, action)` throws `BadRequestException` if the transition is not allowed.

### Recipient upsert on create

When creating a campaign, recipients are upserted by email inside a transaction:
1. Find existing recipient by email or insert new row
2. Insert `campaign_recipients` row (skip if already linked) with a unique `tracking_token` (12-char `short-unique-id`)

### Open tracking

`GET /campaigns/open/:tracking_token` is public. It:
- Silently ignores unknown tokens (no 404 — avoids token enumeration)
- Throws `BadRequestException` if the recipient's status is not `sent`
- Records `opened_at` timestamp once (first open only, subsequent calls are no-ops)

### Stats

`CampaignStats` fields computed on-the-fly from `campaign_recipients`:
- `total`, `sent`, `failed`, `pending`
- `openRate` = opened / sent × 100 (0 if no sent recipients)
- `failedRate` = failed / total × 100

---

## Scheduled job (`CampaignSchedulerService`)

Registered in `CampaignsModule`. Powered by `@nestjs/schedule` (`ScheduleModule.forRoot()` in `AppModule`).

### `@Cron(EVERY_MINUTE) handleScheduledCampaigns()`

Runs every 60 seconds:
1. Queries `campaigns` where `status = 'scheduled'` AND `scheduled_at <= now`
2. Calls `dispatchCampaign(id, name)` for each due campaign

### `dispatchCampaign(campaignId, campaignName?)`

Also called directly by `POST /campaigns/:id/send`.

1. Fetches all `pending` recipients for the campaign (joins `recipients` table for email)
2. For each recipient, simulates delivery with a **20% failure rate** (`FAIL_RATE = 0.2`):
   - **Fail:** sets status = `failed`
   - **Success:** sets status = `sent`, records `sent_at`
3. Sets campaign `status = 'sent'`

Logs each result via `Logger`. No external mailer — delivery is simulated.

---

## `apps/web` — React SPA

### Stack

- React 18 + TypeScript
- React Router 6 (browser router)
- Redux Toolkit + `react-redux` for state
- TanStack React Query (via `queryClient`) for HTTP caching in actions
- Tailwind CSS v4 (no separate CSS files — Tailwind only)
- Zod (shared from `@repo/schemas`)
- Sonner for toasts
- Vite + Vitest

### Folder structure

```
apps/web/src/
├── main.tsx
├── index.css                          # Global Tailwind base only
├── routes/index.tsx                   # React Router route definitions
├── app/App.tsx                        # Root shell — campaigns list page layout
├── pages/                             # One component per route
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── SignUpPage.tsx
│   ├── campaigns/
│   │   └── CampaignDetailPage.tsx
│   └── TrackingPage.tsx               # Public open-tracking pixel page
├── smart-components/                  # Stateful, feature-specific components
│   └── campaigns/
│       ├── CampaignList.tsx           # Paginated campaign table (fetches own data)
│       ├── CampaignRecipientsTable.tsx # Paginated recipients table (fetches own data)
│       ├── CreateCampaignDialog.tsx
│       ├── EditCampaignDialog.tsx
│       └── ScheduleCampaignDialog.tsx
├── components/                        # Stateless base components
│   ├── AppLayout.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── CampaignItem.tsx
│   ├── ConfirmDialog.tsx
│   ├── DonutChart.tsx
│   ├── Input.tsx
│   ├── Pagination.tsx
│   ├── ProtectedRoute.tsx
│   ├── StatCard.tsx
│   └── Tooltip.tsx
├── store/
│   ├── index.ts                       # Redux store — combines auth + campaigns
│   ├── auth/
│   │   ├── auth.actions.ts
│   │   ├── auth.slice.ts
│   │   └── auth.selectors.ts
│   └── campaigns/
│       ├── campaigns.actions.ts
│       ├── campaigns.slice.ts
│       └── campaigns.selectors.ts
├── lib/
│   ├── api.ts                         # Thin fetch wrapper (apiClient)
│   └── queryClient.ts                 # TanStack QueryClient instance
└── hooks/
```

### Routes

| Path | Component | Guard |
|---|---|---|
| `/` | `App` (campaign list) | `ProtectedRoute` |
| `/campaigns/:id` | `CampaignDetailPage` | `ProtectedRoute` |
| `/login` | `LoginPage` | public |
| `/signup` | `SignUpPage` | public |
| `/open/:tracking_token` | `TrackingPage` | public |

`ProtectedRoute` reads auth state from Redux. Unauthenticated users are redirected to `/login`.

### Component layers

| Layer | Location | Rule |
|---|---|---|
| Base components | `components/` | Stateless, no Redux, no API calls — pure props |
| Smart components | `smart-components/<domain>/` | May use Redux selectors/dispatch; own their data fetching |
| Pages | `pages/<domain>/` | Compose smart + base components; own routing and page-level state only |

### State management pattern

All async data flows through Redux thunks in `campaigns.actions.ts`:

```
Component dispatch → action thunk → queryClient.fetchQuery (HTTP) → dispatch slice reducer
```

React Query is used purely for HTTP caching (`queryClient.fetchQuery` / `removeQueries`). Redux is the UI state store.

**HTTP client:** `apiClient` in `lib/api.ts` — thin wrapper over `fetch` that sends credentials (cookies), throws on non-2xx, and returns `undefined` for 204.

### Redux slice: `campaigns`

Key state groups:

| Group | State fields |
|---|---|
| List | `items`, `total`, `page`, `limit`, `totalPages`, `loading`, `error` |
| Detail | `detail` (Campaign + stats), `detailLoading`, `detailError` |
| Mutations | `mutationError` |
| Tracking | `trackingState` |
| Recipients | `recipients`, `recipientsTotal`, `recipientsPage`, `recipientsLimit`, `recipientsTotalPages`, `recipientsLoading`, `recipientsError` |

### Pagination

Use the `<Pagination>` base component. Smart components own page state and dispatch a fresh fetch on `onPageChange`:

```tsx
<Pagination
  page={pagination.page}
  totalPages={pagination.totalPages}
  total={pagination.total}
  label="campaigns"
  onPageChange={(page) => dispatch(fetchCampaigns(page, pagination.limit))}
/>
```

Render `<Pagination>` only when `totalPages > 1`.

---

## Adding a new API endpoint — checklist

1. **Schema** — add/update in `packages/schemas/src/`, rebuild: `pnpm --filter @repo/schemas build`
2. **DTO** — create in `apps/api/src/modules/<feature>/dto/` extending `createZodDto()`
3. **Service** — add method; always call `findOwnedCampaign` (or equivalent) before touching user-owned data
4. **Controller** — add route; use `@Query() query: PaginationQueryDto` for paginated list endpoints
5. **Frontend action** — add thunk in `campaigns.actions.ts` using `queryClient.fetchQuery` + dispatch pattern
6. **Frontend slice** — add state + reducers for loading/data/error
7. **Frontend selectors** — add memoized selectors
8. **Component** — wire up in a smart component or page

## Security rules (always apply)

- **Never interpolate user input into raw SQL** — use Knex parameterized methods
- **Always check ownership** before returning or mutating a user-owned resource
- **Never skip `@Auth()`** on protected routes — apply at controller level, opt out with `@Public()`
- **Consistent error messages** on auth failures to prevent enumeration (see `AUTH_ERRORS.INVALID_CREDENTIALS`)
