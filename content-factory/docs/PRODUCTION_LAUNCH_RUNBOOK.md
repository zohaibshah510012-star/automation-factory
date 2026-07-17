# Production Launch Runbook

Last updated: 2026-07-17

Purpose: exact deployment procedure for Automation Factory production launch on a Linux VPS.

Recommended first launch mode: PM2 + Nginx/Baota + Supabase managed database. Docker remains an alternate runtime if it is installed and tested on the VPS.

Safety rules:

- Do not commit `.env`, `.env.local`, `.env.production`, database dumps, or provider secrets.
- Do not modify AI Runtime, Workflow Engine, Billing Core, Credits Core, or database schema during launch.
- Do not invite customers until backup, migration verification, runtime startup, and smoke tests are complete.

## 1. Clone repository

```bash
mkdir -p /www/wwwroot/automation-factory
cd /www/wwwroot/automation-factory
git clone <repo-url> content-factory
cd content-factory
git rev-parse HEAD
```

Record the deployed commit in the release note.

## 2. Install dependencies

```bash
node -v
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
pnpm install --frozen-lockfile
```

Expected result: dependency install completes without lockfile changes.

## 3. Configure environment

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Fill real production values in `.env.production`.

Required groups:

- Supabase URL and keys
- Admin/auth settings
- AI provider settings
- Storage settings if production asset storage is enabled
- Payment/email/webhook/cron settings if those systems are active

PM2 note: the current app uses Next.js standalone. Ensure the runtime process receives the production variables. Use one of these server-side approaches:

```bash
set -a
. ./.env.production
set +a
pm2 start ecosystem.config.cjs
```

or configure the environment in the VPS/PM2 secret manager. Do not paste secrets into the repository.

## 4. Database check

Confirm the Supabase CLI is linked to the correct production project before any migration command:

```bash
supabase status
supabase migration list
```

Current required baseline:

```text
0001_content_factory.sql
...
0032_founder_revenue_validation.sql
```

If production is behind and the linked project is correct:

```bash
supabase db push
supabase migration list
```

Acceptance:

- Remote migrations show `0001` through `0032`.
- `/admin/checklist` later reports the same migration baseline.

Do not create a new migration during launch unless a separate production incident fix is approved.

## 5. Create pre-launch backup

Preferred options:

1. Supabase Dashboard backup/export.
2. `supabase db dump` from a machine with Docker available.
3. `pg_dump` using a production `DATABASE_URL` from a secure environment.

Record:

- backup method
- timestamp
- production project ref
- storage location
- restore owner

If no backup exists, stop the launch.

## 6. Build

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Acceptance:

- Lint passes.
- TypeScript passes.
- Next.js build produces standalone output at `.next/standalone/server.js`.

## 7. Start with PM2

Recommended:

```bash
set -a
. ./.env.production
set +a
pm2 start ecosystem.config.cjs
pm2 status automation-factory
pm2 logs automation-factory --lines 100
pm2 save
```

Restart existing deployment:

```bash
set -a
. ./.env.production
set +a
pm2 reload automation-factory --update-env
pm2 status automation-factory
pm2 logs automation-factory --lines 100
```

Local health check:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

## 8. Docker alternative

Use this only if Docker is installed and selected as the production runtime.

```bash
cp .env.production.example .env.production
# Fill .env.production with real values before starting.
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 web
curl -fsS http://127.0.0.1:3000/api/health
```

## 9. Configure Nginx

Nginx should reverse proxy the production domain to the app runtime:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

After applying Nginx:

```bash
nginx -t
systemctl reload nginx
curl -I http://<domain>
```

## 10. Enable SSL

Use Baota SSL panel or certbot.

After SSL is enabled:

```bash
curl -I https://<domain>
curl -fsS https://<domain>/api/health
```

Update Supabase Auth redirect URLs to include:

- `https://<domain>`
- `https://<domain>/beta`
- any configured auth callback path used by the deployed app

## 11. Health check

Required checks:

```bash
curl -fsS https://<domain>/api/health
```

Browser checks:

- `/`
- `/admin/checklist`
- `/brief`
- `/dashboard`
- `/create`
- `/assets`
- `/admin/revenue`

Pass criteria:

- `/api/health` returns healthy database status.
- Admin checklist has no unexpected ERROR.
- Customer Brief can create a Founder project visible in `/admin/revenue`.
- Text/Image/Video fallback paths are verified by `docs/PRODUCTION_SMOKE_TEST_CHECKLIST.md`.

## 12. Rollback

Before launch, record:

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
set -a
. ./.env.production
set +a
pm2 reload automation-factory --update-env
pm2 logs automation-factory --lines 100
```

Docker rollback:

```bash
cd /www/wwwroot/automation-factory/content-factory
git checkout <previous-good-commit>
docker compose up -d --build
docker compose logs --tail=100 web
```

Database rollback:

- Restore from the pre-launch Supabase backup.
- Do not run ad-hoc reverse SQL against production unless the rollback script is tested and approved.

## 13. Launch decision

Go only if all are true:

- Production backup exists.
- Migrations are verified through `0032`.
- PM2 or Docker runtime is healthy.
- Nginx + SSL is healthy.
- Production Smoke Test Checklist passes.
- Admin can see health, tasks, feedback, revenue projects, and checklist state.
