# Production Checklist

Baseline: `0001_content_factory.sql` through `0028_beta_validation_readiness.sql`.

## Environment

- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` is the real production URL
- [ ] `ADMIN_EMAILS` includes the founder/admin email
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set server-side only
- [ ] AI provider variables match `AI_PROVIDER`, `AI_IMAGE_PROVIDER`, and `AI_VIDEO_PROVIDER`
- [ ] Payment, email, storage, webhook, and cron variables are configured or intentionally marked as disabled
- [ ] No private key uses a `NEXT_PUBLIC_` prefix

## Database

- [ ] `supabase/migrations` is continuous from `0001` to `0028`
- [ ] Production Supabase shows all migrations applied through `0028_beta_validation_readiness.sql`
- [ ] RLS is enabled for identity, credits, billing, payment, distribution, short drama, analytics, feedback, and workspace tables
- [ ] `grant_subscription_credits` is idempotent
- [ ] `admin_adjust_user_credits` writes `credit_transactions`

## Deployment

- [ ] `pnpm lint` passes
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm build` passes
- [ ] PM2 starts with `ecosystem.config.cjs` or Docker starts with `docker compose up -d --build`
- [ ] Nginx proxies to `127.0.0.1:3000`
- [ ] SSL is active
- [ ] `/api/health` returns healthy status

## Admin operations

- [ ] `/admin/system` shows no ERROR items
- [ ] `/admin/checklist` is reviewed before traffic
- [ ] `/admin/monitor` shows queue, error, latency, and credits metrics
- [ ] `/admin/tasks` can retry failed tasks
- [ ] `/admin/users` can freeze users and adjust credits
- [ ] `/admin/billing` can manage plans and subscriptions
- [ ] `/admin/payments` shows provider/payment/event state

## Security

- [ ] `/api/test-text` requires admin access
- [ ] `/api/analytics/events` has rate limiting and payload validation
- [ ] Security headers are present in app responses or Nginx
- [ ] Service role key is never exposed to client code
- [ ] Logs do not contain secrets

## Backup and recovery

- [ ] Database backup path is tested
- [ ] Storage backup path is tested if storage is used
- [ ] Restore procedure is documented and executable
- [ ] Rollback commit is known before release
