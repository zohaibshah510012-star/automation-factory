# Automation Factory Production Deployment Plan

Baseline commit: `74569cc0ab3e5442fc4fd8653b29ecb4523918ce`

Target environment: Linux VPS + Baota + domain + Nginx + SSL.

## 1. Server requirements

Recommended minimum:

- Ubuntu 22.04/24.04 or equivalent Linux VPS
- 2 CPU / 4 GB RAM minimum for beta traffic
- 20 GB+ disk
- Node.js 24+
- pnpm via Corepack
- PM2 for process management
- Nginx managed by Baota
- Git
- Supabase CLI for migration deployment

Optional:

- Docker Engine + Docker Compose plugin if container deployment is selected later
- Redis only when async workers/queues are activated

## 2. Domain setup

1. Point the production domain A record to the VPS public IP.
2. Add the domain in Baota site management.
3. Configure Nginx reverse proxy to `http://127.0.0.1:3000`.
4. Set `NEXT_PUBLIC_APP_URL=https://your-domain.com`.
5. Configure Supabase Auth redirect URLs to the production domain.

## 3. SSL

1. Use Baota SSL or certbot to issue a certificate.
2. Enable HTTPS for the production domain.
3. Redirect HTTP to HTTPS after smoke tests pass.
4. Verify:

```bash
curl -I https://your-domain.com
```

Required response headers should include:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`

## 4. Environment setup

Create production env from the template:

```bash
cd /www/wwwroot/automation-factory/content-factory
cp .env.production.example .env.local
```

Fill real values for:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Admin: `ADMIN_EMAILS`
- AI: `AI_PROVIDER`, selected provider API keys
- Payment: provider settings if real payment is enabled
- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
- Storage: `STORAGE_BUCKET` if media storage is used
- Webhook: `WEBHOOK_SIGNING_SECRET`
- Cron: `CRON_SECRET`

Current template coverage includes Supabase, OpenAI, DeepSeek, media providers, payment, email, storage, webhook, cron, and optional outbound proxy variables.

Never place service role keys, provider secrets, payment secrets, or webhook secrets in variables prefixed with `NEXT_PUBLIC_`.

## 5. Database migration

Current local migrations are continuous from:

```text
0001_content_factory.sql
...
0030_founder_beta_run.sql
```

Production deployment steps:

```bash
cd /www/wwwroot/automation-factory/content-factory
supabase migration list
supabase db push
supabase migration list
```

Acceptance criteria:

- Remote Supabase migration list shows all migrations through `0030_founder_beta_run.sql`.
- Required tables exist: `profiles`, `content_tasks`, `credit_transactions`, `plans`, `subscriptions`, `payment_providers`, `distribution_jobs`, `short_drama_assets`, `product_events`, `user_feedback`, `workspaces`, `beta_cohorts`, `beta_cohort_members`, `beta_review_notes`.
- Required RPCs exist: `grant_subscription_credits`, `admin_adjust_user_credits`.

Use `supabase db push` for the current Supabase CLI workflow. If the deployment environment standardizes on migration bundles/CI later, replace this with the equivalent non-interactive migration deploy command.

## 6. Docker deployment

Docker assets exist:

- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml`

Dockerfile characteristics:

- Multi-stage build
- Node 24 Alpine runtime
- pnpm/Corepack support
- Next.js standalone output
- Non-root `nextjs` runtime user
- `/api/health` healthcheck
- Production `NODE_ENV`, `PORT`, and `HOSTNAME`

Docker Compose characteristics:

- `web` service starts the production app
- `database`, `redis`, and `worker` are reserved with `future` profiles
- Restart policy: `unless-stopped`
- Healthcheck on `/api/health`
- Loads `.env.production.example` plus optional `.env.production`

Docker command:

```bash
cd /www/wwwroot/automation-factory/content-factory
cp .env.production.example .env.production
# Fill .env.production with real values.
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

Important: current verification machine does not have Docker CLI installed, so Docker was configuration-reviewed only, not runtime-tested locally.

## 7. First admin login

1. Set `ADMIN_EMAILS=founder@example.com`.
2. Start the app.
3. Login/register with that email.
4. The bootstrap admin logic promotes the matching profile to `admin`.
5. Verify access:

- `/admin`
- `/admin/system`
- `/admin/checklist`
- `/admin/monitor`
- `/admin/billing`
- `/admin/payments`
- `/admin/founder`

## 8. Health verification

Application health:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS https://your-domain.com/api/health
```

Admin verification:

- `/admin/system`: database, storage, AI, payment, email, webhook, cron, environment
- `/admin/checklist`: launch gate with READY/WARNING/ERROR
- `/admin/monitor`: task success/failure rate, provider errors, latency, credits, queue status
- `/admin/founder`: Founder Beta Run cohort, first-value metrics, cost signals, and review notes

Smoke tests:

1. User login
2. Workspace creation
3. Billing dashboard
4. Credits balance
5. Prompt/content task creation
6. Image/video task creation if providers are configured
7. Admin user/task/billing/payment/analytics pages
8. Founder Beta Run page and Review Notes workflow

## 9. Rollback procedure

Before release:

```bash
git rev-parse HEAD
supabase migration list
```

PM2 rollback:

```bash
cd /www/wwwroot/automation-factory/content-factory
git checkout <previous-good-commit>
pnpm install --frozen-lockfile
pnpm build
pm2 reload automation-factory
pm2 logs automation-factory --lines 100
```

Docker rollback:

```bash
cd /www/wwwroot/automation-factory/content-factory
git checkout <previous-good-commit>
docker compose up -d --build
docker compose logs -f web
```

Database rollback:

- Prefer restoring a pre-release Supabase backup.
- Do not manually reverse production migrations unless the exact rollback SQL has been tested.

## Recommended deployment mode

Use PM2 + Baota Nginx for the first production launch.

Reason:

- The repository already contains `ecosystem.config.cjs` targeting Baota paths.
- Baota commonly manages Node, PM2, Nginx, SSL, and logs directly.
- Supabase is managed externally, so Docker does not provide a major operational advantage for the first launch.
- Docker remains ready as a future standardized deployment path after runtime testing on the VPS.

## Current readiness assessment

Estimated production readiness: `88%`.

Can deploy: yes, after production environment variables and Supabase migrations are applied on the VPS.

Remaining pre-deploy issues:

1. Docker runtime is not locally tested because Docker CLI is unavailable on the current machine.
2. Real payment/email/webhook/storage provider credentials must be configured and verified in production or accepted as WARNING states.
