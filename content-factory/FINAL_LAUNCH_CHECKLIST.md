# Final Launch Checklist

Baseline: `0001` through `0030`.

## 1. Supabase migration verification

- [ ] `supabase/migrations` contains exactly `0001` through `0030`
- [ ] No duplicate migration prefixes
- [ ] Production Supabase has applied through `0030_founder_beta_run.sql`
- [ ] Required billing/payment/distribution/analytics/workspace tables exist
- [ ] `grant_subscription_credits` and `admin_adjust_user_credits` RPCs exist

## 2. Environment verification

- [ ] `.env.production` or hosting secrets match `.env.production.example`
- [ ] No service role key is exposed through `NEXT_PUBLIC_*`
- [ ] AI provider variables match selected providers
- [ ] Payment/email/storage/webhook/cron variables are configured or intentionally disabled

## 3. Baota / server deployment

- [ ] Node.js 24+ installed
- [ ] pnpm installed
- [ ] PM2 installed if not using Docker
- [ ] Nginx installed
- [ ] SSL certificate issued and active

## 4. PM2 verification

```bash
pnpm install --frozen-lockfile
pnpm build
pm2 start ecosystem.config.cjs
pm2 save
pm2 status automation-factory
pm2 logs automation-factory --lines 100
```

## 5. Docker verification

```bash
cp .env.production.example .env.production
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

## 6. Nginx verification

- [ ] Site proxies to `http://127.0.0.1:3000`
- [ ] WebSocket upgrade headers configured
- [ ] Gzip enabled
- [ ] Security headers configured
- [ ] `nginx -t` passes

## 7. SSL verification

- [ ] HTTPS loads without browser warning
- [ ] HTTP redirects to HTTPS when enabled
- [ ] Certificate auto-renewal is configured

## 8. User smoke test

- [ ] Register/login
- [ ] Create workspace
- [ ] Open `/dashboard/templates`
- [ ] Create first task
- [ ] Verify credits are consumed
- [ ] View generated content
- [ ] Open `/dashboard/billing`

## 9. Admin smoke test

- [ ] `/admin/system`
- [ ] `/admin/checklist`
- [ ] `/admin/monitor`
- [ ] `/admin/users`
- [ ] `/admin/tasks`
- [ ] `/admin/billing`
- [ ] `/admin/payments`
- [ ] `/admin/analytics`
- [ ] `/admin/founder`

## 10. Billing and payment

- [ ] Create plan
- [ ] Assign subscription
- [ ] Grant subscription credits once
- [ ] Repeat grant and confirm idempotency
- [ ] Create mock checkout
- [ ] Verify payment as owner
- [ ] Confirm another normal user cannot verify the payment
- [ ] Confirm admin can inspect payments

## 11. Beta readiness

- [ ] Admin creates invite at `/admin/beta`
- [ ] Invite URL opens `/beta`
- [ ] Invite email and code validate before magic-link login
- [ ] First dashboard entry calls `/api/auth/bootstrap`
- [ ] `signup_completed` event is recorded
- [ ] `first_workspace_created` event is recorded after workspace creation
- [ ] `first_generation_started` and `first_generation_completed` events are recorded
- [ ] `first_asset_created` event is recorded when the first asset is saved
- [ ] `credits_consumed` event is recorded after credits settlement
- [ ] User submits feedback with satisfaction, notes, and optional task ID
- [ ] Admin feedback queue supports `open`, `reviewing`, and `resolved`
- [ ] `/admin/analytics` shows Beta Metrics
- [ ] `/admin/founder` shows the Founder Beta Run cohort, first-value metrics, cost signals, and review notes

## 12. Rollback

- [ ] Previous commit ID recorded
- [ ] Database backup completed
- [ ] Storage backup completed if applicable
- [ ] PM2/Docker rollback command tested
