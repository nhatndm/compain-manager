---
name: api-security
description: Security rules for @repo/api. Apply this whenever writing any endpoint that requires authentication, building database queries in a service, or handling user-provided input. Always use this when someone asks about protecting routes, verifying tokens, or querying the database with dynamic values in the NestJS API.
---

# API Security

Two areas to get right on every feature: **authentication enforcement** and **safe database queries**.

## Authentication — Use Guards

Any endpoint that requires a logged-in user must be protected with a NestJS Guard. Never rely on checking auth inside a controller method body — that's easy to forget and impossible to enforce consistently.

### Applying a Guard

```ts
import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../../auth/auth.guard'

@Controller('campaigns')
export class CampaignsController {

  @Get()
  @UseGuards(AuthGuard)          // protects this route
  findAll() { ... }

  @Get('public-stats')           // no guard = public
  publicStats() { ... }
}
```

Apply `@UseGuards` at the **controller level** to protect all routes in a controller, or at the **method level** to protect individual routes.

### Implementing a Guard

```ts
// apps/api/src/auth/auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const token = request.headers['authorization']?.split(' ')[1]

    if (!token) throw new UnauthorizedException()

    // validate token, attach user to request
    // request.user = verifiedUser
    return true
  }
}
```

### Accessing the Authenticated User

Use a custom decorator to extract the user from the request cleanly:

```ts
// apps/api/src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user
  },
)
```

```ts
@Get('me')
@UseGuards(AuthGuard)
getMe(@CurrentUser() user: User) {
  return user
}
```

## Database Queries — Prevent SQL Injection

Always use Knex's parameterized query methods. **Never interpolate user input into query strings.**

### Safe — use Knex bindings

```ts
// ✅ Safe — knex parameterizes the value
const user = await this.knex('users').where('email', email).first()

// ✅ Safe — explicit binding
const campaigns = await this.knex('campaigns')
  .where('created_by', userId)
  .where('status', status)
  .select()

// ✅ Safe — insert
await this.knex('campaigns').insert({ name, subject, body, created_by: userId })

// ✅ Safe — update with where
await this.knex('campaigns').where('id', id).update({ status: 'sent' })
```

### Unsafe — never do this

```ts
// ❌ SQL injection risk
await this.knex.raw(`SELECT * FROM users WHERE email = '${email}'`)

// ❌ SQL injection risk
await this.knex.raw(`UPDATE campaigns SET status = '${status}' WHERE id = '${id}'`)
```

If you must use `knex.raw`, always use bindings:

```ts
// ✅ raw with bindings — safe
await this.knex.raw('SELECT * FROM users WHERE email = ?', [email])
```

## Authorization — Check Ownership

Authentication proves who the user is. Authorization proves what they can access. After authenticating, verify the user owns the resource:

```ts
async findOne(id: string, userId: string) {
  const campaign = await this.knex('campaigns').where('id', id).first()

  if (!campaign) throw new NotFoundException('Campaign not found')
  if (campaign.created_by !== userId) throw new ForbiddenException()

  return campaign
}
```

Never return a resource without checking ownership when the resource belongs to a user.
