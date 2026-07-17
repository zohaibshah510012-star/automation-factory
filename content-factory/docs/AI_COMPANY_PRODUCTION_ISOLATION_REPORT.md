# AI-Company Production Isolation Report

Date: 2026-07-17

Scope: assess whether Automation Factory / AI-Company can enter Beta without relying on other server assets.

Mode: documentation-only assessment. No server, code, or database changes were made.

## Executive conclusion

AI-Company can be isolated for Beta as an independent SaaS service if it is deployed with its own production environment, managed Supabase project, domain, SSL, and AI provider credentials.

The current repository does not show runtime dependency on:

- afeng MySQL
- Redis
- AIXHub
- Yuedong / 悦动

The product is not fully production-independent until the production Supabase migration state, environment variables, backup procedure, and asset persistence model are verified on the target VPS.

Recommended status: conditionally Beta-ready after the must-fix items in this report are completed.

## Source documents and gaps

Requested documents checked:

- `AGENTS.md`: present at repository root.
- `docs/PROJECT_STATUS.md`: present.
- `docs/SESSION_CONTEXT.md`: missing.
- `docs/PRODUCTION_SERVICE_INVENTORY.md`: missing.
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md`: missing.

Related production files used as fallback evidence:

- `package.json`
- `.env.production.example`
- `Dockerfile`
- `docker-compose.yml`
- `ecosystem.config.cjs`
- `DEPLOYMENT.md`
- `PRODUCTION_DEPLOYMENT_PLAN.md`
- `PRODUCTION_READINESS_REPORT.md`
- `FINAL_LAUNCH_CHECKLIST.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `docs/RUNBOOK.md`
- `docs/BACKUP.md`
- `docs/RESTORE.md`
- `src/lib/supabase/server.ts`
- `src/lib/production-diagnostics.ts`
- `supabase/migrations/`

Documentation gap: the two requested production docs, service inventory and launch runbook, do not currently exist under `docs/`. Existing deployment docs cover much of the same content, but the missing files reduce operational clarity.

## 1. AI-Company dependency inventory

### Application runtime

- Next.js 16 App Router.
- React 19.
- TypeScript.
- Tailwind / shadcn-style UI components.
- Node.js 24 target for PM2 and Docker.
- pnpm package manager.
- Next.js standalone build output enabled in `next.config.ts`.

### Deployment assets

- PM2 deployment: `ecosystem.config.cjs`.
- Docker deployment: `Dockerfile`, `.dockerignore`, `docker-compose.yml`.
- Nginx deployment examples: `deployment/nginx/`.
- Health endpoint: `/api/health`.
- Production diagnostics: `/admin/system`, `/admin/checklist`, `/admin/monitor`, `/admin/health`.

### Database and auth

Primary database/auth dependency is Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Server code creates the Supabase service client only from `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Current local migration files are continuous through:

- `0032_founder_revenue_validation.sql`

Important note: several production docs still mention `0030_founder_beta_run.sql` as the expected latest migration. That is now outdated.

### AI providers

Text generation:

- DeepSeek
- OpenAI
- Gemini
- local fallback where implemented

Image generation:

- OpenAI image
- Gemini image
- Flux
- local fallback

Video generation:

- Runway
- Kling
- local fallback

Beta can run with local image/video fallback, but paid/commercial quality requires real provider credentials and one controlled production smoke test.

### Billing and payments

Payment framework exists for:

- mock payment provider
- Stripe variables
- PayPal variables

For Beta user validation, real payment can remain disabled. For revenue collection, Stripe/PayPal sandbox and webhook verification are required before accepting payment traffic.

### Email, storage, webhooks, cron

These are environment-gated:

- SMTP / `EMAIL_FROM`
- `STORAGE_BUCKET`
- `WEBHOOK_SIGNING_SECRET`
- `CRON_SECRET`

Production diagnostics treat missing email/storage/webhook/cron as WARNING unless a selected user flow requires them.

## 2. External service dependencies

Required for Beta:

| Dependency | Required | Current role |
| --- | --- | --- |
| Supabase | Yes | Auth, Postgres, RLS, service-role writes, migrations |
| Domain + DNS | Yes | Public Beta access |
| Nginx + SSL | Yes | Reverse proxy and HTTPS |
| DeepSeek or OpenAI text provider | Yes for real text generation | Text content generation |
| VPS / PM2 or Docker host | Yes | App runtime |

Conditionally required:

| Dependency | Required when | Current role |
| --- | --- | --- |
| OpenAI / Flux / Gemini image provider | Required for real image generation | Local fallback exists for Beta demos |
| Kling / Runway video provider | Required for real video generation | Local fallback exists for Beta previews |
| Stripe / PayPal | Required for real payments | Mock/payment framework exists |
| SMTP | Required for transactional email beyond Supabase Auth flow | Optional warning |
| Supabase Storage | Required for durable cloud asset storage | Local generated assets exist; cloud persistence not yet mandatory |
| Cron | Required for scheduled jobs | Optional warning |

Not required for current Beta isolation:

- afeng MySQL
- Redis
- AIXHub
- Yuedong / 悦动
- External publishing platform OAuth for TikTok / YouTube Shorts / 小红书

## 3. afeng MySQL dependency assessment

Result: no runtime dependency found.

Evidence:

- No MySQL client dependency appears in `package.json`.
- Repository search for `mysql`, `MYSQL`, and `afeng` found no application runtime usage.
- Database access is implemented through Supabase/Postgres via `@supabase/supabase-js`.

Conclusion: AI-Company can be deployed without afeng MySQL.

## 4. Redis dependency assessment

Result: Redis is not required for current Beta runtime.

Evidence:

- Redis appears in `docker-compose.yml` only under a `future` profile.
- Deployment docs describe Redis as optional when async workers/queues are activated.
- No Redis client dependency appears in `package.json`.
- Runtime code search found no Redis access layer.

Conclusion: AI-Company can enter Beta without Redis.

Risk: if future background workers or queue processing are activated, Redis may become required. That is not the current deployment path.

## 5. AIXHub / Yuedong dependency assessment

Result: no dependency found.

Evidence:

- Repository search for `AIXHub`, `AIXHUB`, `Yuedong`, `YUEDONG`, and `悦动` found no application usage.
- Provider registry and environment template reference DeepSeek, OpenAI, Gemini, Flux, Runway, Kling, and local fallback providers only.

Conclusion: AI-Company can be isolated from AIXHub/Yuedong.

## 6. Current deployment risks

### High

1. Production migration docs are outdated.
   - Actual local migrations run through `0032_founder_revenue_validation.sql`.
   - Several production docs still list `0030_founder_beta_run.sql` as the latest production baseline.
   - Risk: deploying with only 0030 would miss Founder revenue validation/customer project tables.

2. Production Supabase state must be verified.
   - The app requires managed Supabase for auth, database, RLS, credits, tasks, analytics, feedback, and admin operations.
   - Risk: wrong Supabase project or incomplete migrations will break Beta flows.

3. Production secrets are not verified in this assessment.
   - Required values include Supabase keys, admin emails, provider keys, app URL, and selected provider settings.
   - Risk: `/api/health`, auth bootstrap, generation, or admin access can fail.

4. Asset persistence model is not fully production-hardened.
   - Local image/video fallback generates files under the app/public generated asset path.
   - This is acceptable for a single persistent VPS Beta, but weaker than Supabase Storage for durable multi-instance or container rebuild scenarios.

### Medium

1. Real image/video provider quality is not proven in production.
   - Local fallback is enough for Beta demos.
   - Commercial output quality requires OpenAI/Flux and Kling/Runway provider smoke tests.

2. Payment/email/webhook/cron are framework-ready but not required for first Beta.
   - Missing configuration should be treated as WARNING unless the Beta scope includes paid checkout or transactional email.

3. Docker is configuration-ready but not proven on this machine.
   - PM2 + Baota Nginx remains the recommended first production path.

4. Requested production service inventory and launch runbook docs are missing.
   - Existing deployment docs partially cover the gap, but the explicit documents should be added or redirected before serious operations.

### Low

1. Redis and local Postgres are reserved in Docker Compose future profiles.
   - This is not a runtime blocker.

2. External publishing platform integrations are not active.
   - Distribution MVP creates manual export packages, not automatic posting.

## 7. Beta上线所需最小条件

Minimum conditions before inviting Beta users:

1. Dedicated Supabase project confirmed.
2. `supabase migration list` shows migrations applied through `0032_founder_revenue_validation.sql`.
3. Production environment variables configured:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_APP_URL`
   - `ADMIN_EMAILS`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_PROVIDER`
   - selected text provider key, such as `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`
4. PM2 + Baota Nginx + SSL configured.
5. `/api/health` returns healthy database status.
6. Admin can access:
   - `/admin/system`
   - `/admin/checklist`
   - `/admin/monitor`
   - `/admin/revenue`
7. Smoke test passes:
   - login
   - dashboard
   - `/brief`
   - create workflow
   - task result
   - assets
   - feedback
   - admin revenue/customer project review
8. Supabase backup is created before opening Beta.
9. Rollback commit and rollback command are recorded.

## 可上线项

- Next.js application can run as a standalone service.
- PM2 deployment path exists.
- Docker deployment path exists for future/runtime verification.
- Managed Supabase architecture allows isolation from other server databases.
- No afeng MySQL dependency found.
- No Redis runtime dependency found.
- No AIXHub/Yuedong dependency found.
- Customer-facing Chinese product path exists.
- Customer Brief intake exists at `/brief`.
- Founder revenue validation and `/admin/revenue` exist.
- Admin diagnostics, checklist, monitor, health, users, tasks, analytics, feedback, and founder operations exist.
- Local image/video fallback allows Beta demos without paid media providers.

## 不可上线项 / 不应承诺项

- Do not promise real production-grade video generation until Kling or Runway is configured and smoke-tested.
- Do not promise durable cloud asset storage until Supabase Storage or another object store is configured and backup-tested.
- Do not accept real payments until Stripe/PayPal sandbox, webhook, and reconciliation checks pass.
- Do not claim production migration readiness while docs still refer to 0030 as latest baseline.
- Do not rely on missing `docs/PRODUCTION_SERVICE_INVENTORY.md` or `docs/PRODUCTION_LAUNCH_RUNBOOK.md` as operational source of truth.

## 必须修复项

Before Beta traffic:

1. Align production migration documentation from `0030` to `0032`.
2. Confirm production Supabase has migrations `0001` through `0032` applied.
3. Create or redirect the missing production docs:
   - `docs/PRODUCTION_SERVICE_INVENTORY.md`
   - `docs/PRODUCTION_LAUNCH_RUNBOOK.md`
4. Configure production `.env.local` or secret store with required Supabase/admin/provider variables.
5. Run production smoke test on the target VPS.
6. Create a pre-Beta Supabase backup.

Before paid/commercial delivery:

1. Configure and verify real image provider.
2. Configure and verify real video provider if video is part of the customer deliverable.
3. Decide whether generated assets should move from local filesystem fallback to Supabase Storage.
4. Verify payment provider only if paid checkout is enabled.

## 建议上线时间点

Recommended Beta launch point: after one focused production operations pass, not immediately from the current document state.

Suggested sequence:

1. Update production baseline docs to `0032`.
2. Verify target Supabase migration state through `0032`.
3. Configure production environment on the VPS.
4. Start with PM2 + Baota Nginx + SSL.
5. Run `/api/health`, `/admin/checklist`, `/brief`, user generation, assets, feedback, and `/admin/revenue` smoke tests.
6. Invite the first 1-2 controlled Beta users.
7. Expand to 3-5 users after 24 hours without P0/P1 incidents.

If the target VPS, Supabase project, domain, and provider secrets are ready, this can be done in the next production prep session. If secrets or Supabase migrations are not ready, the blocker is operations configuration, not application architecture.
