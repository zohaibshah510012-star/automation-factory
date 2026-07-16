# Production Readiness Report

Generated for GA Production Ops Hardening v1.

## Current baseline

- Branch: `master`
- Application root: `content-factory`
- Latest expected migration: `0028_beta_validation_readiness.sql`
- Build target: Next.js standalone
- Deployment modes: PM2 or Docker Compose behind Nginx

## Passed locally

- Git working tree was clean before hardening work started.
- Local migrations are continuous from `0001` to `0028`.
- `SUPABASE_SERVICE_ROLE_KEY` is documented as server-only.
- `NEXT_PUBLIC_*` variables are limited to public Supabase/app values.
- Payment verification includes owner/admin context.
- Admin production diagnostics are available through `/admin/system`, `/admin/checklist`, and `/admin/monitor`.
- Production security headers are configured in `next.config.ts`.

## Production launch gates

The release is ready only after these production checks pass:

1. Apply Supabase migrations through `0028_beta_validation_readiness.sql`.
2. Configure `.env.production` or hosting secrets from `.env.production.example`.
3. Run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`.
4. Start with PM2 or Docker Compose.
5. Configure Nginx reverse proxy and SSL.
6. Verify `/api/health`.
7. Review `/admin/checklist`.
8. Run user and admin smoke tests.

## Known warnings

- Real Stripe/PayPal providers are framework-ready but require sandbox credentials and webhook contract verification before production billing traffic.
- Email, storage, webhook, and cron checks are WARNING unless their environment variables are configured.
- Docker Compose reserves future `database`, `redis`, and `worker` services but the current production app still uses managed Supabase.

## Required smoke tests

- User signup/login
- Workspace creation
- Plan/subscription assignment
- Credit grant and consumption
- Prompt/content generation
- Image/video task creation
- Distribution mock publish
- Billing dashboard
- Payment mock checkout/verify
- Admin system/checklist/monitor
- Admin users/tasks/billing/payments/analytics
