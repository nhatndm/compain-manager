---
name: api-code-quality
description: Code quality and SOLID principles for @repo/api. Apply this when writing or reviewing any service, module, controller, or class in the NestJS API. Use this whenever someone is adding business logic, refactoring code, creating a new class, or asking how something should be structured or organized in the API.
---

# API Code Quality

The project follows SOLID principles. These aren't rules for their own sake — they keep the codebase testable, maintainable, and safe to change as the project grows.

## Single Responsibility

Each class does one thing. If you find yourself writing "and" when describing what a class does, it probably needs to be split.

```ts
// ✅ CampaignsService — manages campaign data
// ✅ MailerService    — handles sending emails
// ✅ AuthGuard        — verifies authentication

// ❌ CampaignsService that also sends emails and logs analytics
```

Controllers are responsible for HTTP — they parse requests and return responses. Services are responsible for business logic and data access. Keep these separate.

```ts
// ✅ Controller only handles HTTP concerns
@Post()
async create(@Body() dto: CreateCampaignDto) {
  return this.campaignsService.create(dto)  // delegates to service
}

// ❌ Business logic leaking into controller
@Post()
async create(@Body() dto: CreateCampaignDto) {
  const existing = await this.knex('campaigns').where('name', dto.name).first()
  if (existing) throw new ConflictException()
  // ...
}
```

## Open/Closed

Classes should be open for extension but closed for modification. Extend behaviour through interfaces and injection, not by editing existing classes.

```ts
// Define an interface for the contract
export interface NotificationSender {
  send(to: string, subject: string, body: string): Promise<void>
}

// Implement it
@Injectable()
export class EmailSender implements NotificationSender {
  async send(to, subject, body) { /* ... */ }
}

// Depend on the interface — swapping implementations requires zero changes here
@Injectable()
export class CampaignsService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    @Inject('NOTIFICATION_SENDER') private readonly sender: NotificationSender,
  ) {}
}
```

## Dependency Inversion

High-level modules (services, controllers) should depend on abstractions, not on concrete implementations. NestJS's DI container is the mechanism for this — use it.

```ts
// ✅ Injected by NestJS — testable, swappable
@Injectable()
export class CampaignsService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly mailerService: MailerService,
  ) {}
}

// ❌ Manually instantiated — untestable, tightly coupled
export class CampaignsService {
  private knex = knex(knexConfig)          // hardcoded
  private mailer = new MailerService()     // hardcoded
}
```

Never use `new` to create services inside other services or controllers. Register everything as a provider and inject it.

## Practical Patterns

**Keep services focused on one entity/domain.** If `CampaignsService` starts needing to look up recipients and send mail and update analytics, extract each concern into its own service and inject them.

**Avoid fat controllers.** A controller method should be 3–5 lines at most: validate (automatic via `ZodValidationPipe`), call service, return result.

**Write testable code by default.** If a class is hard to unit test, it's a signal that it's doing too much or depending on concretions. The test tells you where the design problem is.

```ts
// ✅ Easy to test — dependencies are injected and mockable
const service = new CampaignsService(mockKnex, mockMailer)

// ❌ Hard to test — dependencies are created internally
const service = new CampaignsService()  // brings real DB and real mailer
```
