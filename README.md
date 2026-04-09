# Campaign Manager

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
- **PostgreSQL** ≥ 17
- **Docker** (for running the project locally)

## Local Setup

### With Docker

```bash
docker compose up
```

### Without Docker

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env files and fill in your values
cp .env.example apps/api/.env
cp .env.example apps/web/.env
```

Edit `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/campaign_manager
JWT_SECRET=your-secret-key
PORT=3000
```

Edit `apps/web/.env`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
# 3. Run migrations and start
pnpm --filter @repo/api db:migrate
pnpm dev
```

Once running:

- API → [http://localhost:3000](http://localhost:3000)
- Web → [http://localhost:5173](http://localhost:5173)

## Build

```bash
# Build all packages and apps (respects dependency order)
pnpm build
```

## Database Migrations

```bash
pnpm --filter @repo/api db:migrate
```

## Testing & Linting

```bash
pnpm test   # Run all test suites
pnpm lint   # Lint all workspaces
```

## Project Structure

```
campaign-manager/
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

---

## How I Used Claude Code

### What I delegated

- Project Codebase Execute after I have designed system and architecture

- Module builder for some basic function, for complex feature we will do pair-programming to ensure business logic is handled correctly

- Implement FE design and api integration

### Real prompts I used

- Use the api-architecture and api-code-quality skills to design and implement the authentication module.

- Use web-architecture, web-api-integration and web-redux-architecture skills to integrate authentication

- 

```
For the Campaign Detail page header:

Left side
Display:
	•	{data.name}
	•	{data.subject}
	•	{data.status}

Right side
Display an action group with these buttons:
	1.	Edit
	•	Opens a dialog with pre-filled campaign information
	•	User can update the campaign details
	•	This button is disabled when the campaign status is not draft
	2.	Schedule
	•	Opens a dialog containing a date picker
	•	This button is disabled when the campaign status is sent
	•	When disabled, show this tooltip: “This campaign has already been sent”
	3.	Send now
	•	Opens a confirmation dialog before sending
	•	This button is disabled when the campaign status is sent
	•	When disabled, show this tooltip: “This campaign has already been sent”
```

### Where Claude Code was wrong or needed correction

- Send Now button text wrapped to two lines.

- Tracking endpoint created in a separate file ( Clause has not picked skills )

- `markOpened` expiry logic was wrong


### What I would not let Claude Code do — and why

- **Project architecture** — The shape of the system (how apps are split, what talks to what, where state lives) reflects long-term tradeoffs I have to live with. Claude optimizes for "works now." I optimize for "maintainable in 6 months." Those aren't the same answer.

- **Review, Commit, push to git** — I need to review what we have been done to know exactly how system works, A commit is permanent and shared. Once it's pushed it's in history, it triggers CI, and teammates see it. Claude doesn't know what's WIP, what's safe to expose, or whether the branch is frozen. I write the diff; I own the commit.

- **Own the final business rules** — Business rules encode product decisions, legal constraints, and edge-case agreements that exist outside the codebase. If Claude implements a rule without asking, it becomes invisible — it looks like code, not a policy, and is easy to miss in review.

- **Choose the library** — Every dependency has a security surface, a license, a bundle cost, and a maintenance risk. Claude can name options with tradeoffs. I pick. Then Claude wires it up.
