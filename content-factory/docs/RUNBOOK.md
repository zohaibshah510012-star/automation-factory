# Production Runbook

## Deploy

```bash
cd /www/wwwroot/automation-factory/content-factory
git pull
pnpm install --frozen-lockfile
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pm2 reload automation-factory || pm2 start ecosystem.config.cjs
pm2 save
curl -fsS http://127.0.0.1:3000/api/health
```

Docker alternative:

```bash
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

## Rollback

```bash
git log --oneline -5
git checkout <previous-good-commit>
pnpm install --frozen-lockfile
pnpm build
pm2 reload automation-factory
```

Docker rollback:

```bash
git checkout <previous-good-commit>
docker compose up -d --build
```

If a database migration caused the incident, restore the database from the pre-release backup rather than attempting ad-hoc SQL rollback.

## Restart

```bash
pm2 restart automation-factory
pm2 status automation-factory
```

Docker:

```bash
docker compose restart web
```

## Logs

```bash
pm2 logs automation-factory --lines 200
tail -f /www/wwwlogs/automation-factory.error.log
tail -f /www/wwwlogs/automation-factory.out.log
```

Docker:

```bash
docker compose logs -f web
```

## Troubleshooting

1. Check `/api/health`.
2. Check `/admin/system`.
3. Check `/admin/checklist`.
4. Check `/admin/monitor`.
5. Check PM2 or Docker logs.
6. Check Nginx error logs.
7. Check Supabase migration status and service health.
8. Verify production environment variables.
