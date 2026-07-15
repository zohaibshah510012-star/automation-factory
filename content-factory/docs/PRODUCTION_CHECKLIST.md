# Production Checklist

## Environment

- [ ] Set `NODE_ENV=production`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAILS`.
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Set `AI_PROVIDER` for text generation: `deepseek`, `openai`, `gemini`, `alternative`, or `local`.
- [ ] Optional media providers: `AI_IMAGE_PROVIDER=openai|flux|local`, `AI_VIDEO_PROVIDER=runway|kling|local`.
- [ ] Set provider keys only in encrypted environment variables: `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, `FLUX_API_KEY`, `RUNWAY_API_KEY`, `KLING_API_KEY`.
- [ ] Set commercial estimates if needed: `CREDIT_PRICE_USD`, `PROVIDER_COST_PER_CREDIT_USD`.
- [ ] Do not commit `.env.local`, service role keys, provider API keys, payment tokens, or webhook secrets.

## Database and Access

- [ ] Confirm Supabase migrations are applied in order from `0001_content_factory.sql` through `0022_workspace_rls_fix.sql`.
- [ ] Confirm RLS is enabled for identity, credits, billing, payment, distribution, short drama, and workspace tables.
- [ ] Verify `grant_subscription_credits` is idempotent by running the same subscription grant twice.
- [ ] Verify normal users can only read their own payments, billing, credits, content, dramas, and workspaces.
- [ ] Verify admin users can access `/admin`, `/admin/billing`, `/admin/payments`, `/admin/analytics`, and `/admin/distribution`.

## Commercial Smoke Test

- [ ] Create a plan in `/admin/billing`.
- [ ] Create or activate a subscription and verify credits are granted through `grant_subscription_credits`.
- [ ] Open `/dashboard/billing` and confirm current plan, balance, usage, and transactions render.
- [ ] Create a mock payment checkout from `/dashboard/billing`, verify it, and confirm the subscription is created.
- [ ] Open `/admin/payments` and confirm providers, payments, and events are visible.
- [ ] Open `/admin/analytics` and confirm revenue, credits, provider cost, gross profit, and ARPU render.

## AI Provider Smoke Test

- [ ] Text: verify DeepSeek or OpenAI content generation with a customer task.
- [ ] Image: verify OpenAI Image or Flux provider only after its environment variables and storage behavior are configured.
- [ ] Video: verify Runway or Kling only after provider endpoint contracts are confirmed in sandbox.
- [ ] Keep `local` provider available for non-paid smoke tests.

## Process and Reverse Proxy

- [ ] Run `pnpm install --frozen-lockfile`.
- [ ] Run `pnpm build` and `pnpm lint`.
- [ ] Run `pm2 start ecosystem.config.cjs` from the project deployment root, then `pm2 save`.
- [ ] Check `pm2 status automation-factory`.
- [ ] Confirm logs at `/www/wwwlogs/automation-factory.error.log` and `/www/wwwlogs/automation-factory.out.log`.
- [ ] Configure Nginx/Baota proxy to `http://127.0.0.1:3000`, bind domain, and enable SSL.
- [ ] Confirm `/api/health` returns `{ status: "ok", database: true }`.
