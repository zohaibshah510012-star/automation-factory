# Automation Factory Deployment Guide

Production baseline: migration `0001_content_factory.sql` through `0028_beta_validation_readiness.sql`.

## 1. Build verification

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

The application root is `content-factory`. Next.js is configured with `output: "standalone"` for PM2 and Docker deployments.

## 2. Required environment

Copy `.env.production.example` to `.env.production` for Docker or configure the same variables in your server/hosting secret store.

Never expose server secrets with `NEXT_PUBLIC_`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | Must be `production` |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |
| `ADMIN_EMAILS` | Yes | Bootstrap admin emails |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only Supabase writes |
| `AI_PROVIDER` | Yes | Text provider |
| `AI_IMAGE_PROVIDER` | Optional | Image provider |
| `AI_VIDEO_PROVIDER` | Optional | Video provider |
| `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` | Provider-specific | AI provider credentials |
| `STRIPE_SECRET_KEY` / `PAYPAL_CLIENT_SECRET` | Payment-specific | Future real payment providers |
| `SMTP_*` / `EMAIL_FROM` | Optional | Email delivery |
| `STORAGE_BUCKET` | Optional | Supabase storage bucket |
| `WEBHOOK_SIGNING_SECRET` | Optional | Webhook verification |
| `CRON_SECRET` | Optional | Cron/worker trigger protection |

## 3. Supabase migrations

Apply all files in lexical order:

```bash
supabase migration list
supabase db push
supabase migration list
```

Expected local latest migration:

```text
0028_beta_validation_readiness.sql
```

Key tables/RPCs expected after migration:

- `profiles`
- `credit_transactions`
- `plans`
- `subscriptions`
- `subscription_adjustments`
- `payment_providers`
- `payments`
- `payment_events`
- `distribution_jobs`
- `distribution_providers`
- `short_drama_assets`
- `short_drama_scenes`
- `product_events`
- `user_feedback`
- `workspaces`
- `workspace_members`
- `grant_subscription_credits`
- `admin_adjust_user_credits`

## 4. PM2 deployment

```bash
pnpm install --frozen-lockfile
pnpm build
pm2 start ecosystem.config.cjs
pm2 save
pm2 status automation-factory
```

Health check:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

## 5. Docker deployment

```bash
cp .env.production.example .env.production
# Fill .env.production with real values.
docker compose up -d --build
docker compose ps
```

The compose file starts the `web` service and reserves future profiles for `database`, `redis`, and `worker`. It loads `.env.production.example` for structure and `.env.production` as an optional local override.

## 6. Nginx / HTTPS

Use `deployment/nginx/site.conf.example` as the site template.

Required production behavior:

- Reverse proxy to `http://127.0.0.1:3000`
- WebSocket upgrade headers
- Gzip enabled
- Security headers enabled
- HTTPS certificate configured through Baota, certbot, or provider-managed SSL

## 7. Admin validation

After login with an admin email:

- `/admin/system`
- `/admin/checklist`
- `/admin/monitor`
- `/admin/health`
- `/admin/tasks`
- `/admin/billing`
- `/admin/payments`
- `/admin/analytics`

Use `/admin/checklist` as the production launch gate.
