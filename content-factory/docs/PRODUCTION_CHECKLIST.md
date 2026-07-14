# Production Checklist

## Environment

- [ ] Set `NODE_ENV=production`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAILS`.
- [ ] Set Supabase URL, anon key and server-only service key.
- [ ] Set `AI_PROVIDER`, provider key and optional model/base URL.
- [ ] Keep keys only in `.env.local`; never commit them.

## Database and access

- [ ] Run `supabase migration list` and confirm migrations `0001`–`0003`.
- [ ] Open `/api/health`; expect `{ status: "ok", database: true }`.
- [ ] Register an email listed in `ADMIN_EMAILS`; confirm `/admin` loads.
- [ ] Confirm a normal account is redirected away from `/admin`.

## Process and reverse proxy

- [ ] Run `pnpm install --frozen-lockfile && pnpm build`.
- [ ] Run `pm2 start ecosystem.config.cjs && pm2 save`.
- [ ] Check `pm2 status automation-factory` and `/www/wwwlogs/automation-factory.*.log`.
- [ ] Configure Baota Nginx proxy to `http://127.0.0.1:3000`, bind domain, enable SSL.

## Product smoke test

- [ ] Register, sign in and verify Credits balance.
- [ ] Copy/edit a Platform Prompt and select it for a task.
- [ ] Create a task; verify pending → generating → completed (or friendly failure).
- [ ] Confirm task, credit transaction and usage history persist after refresh.
