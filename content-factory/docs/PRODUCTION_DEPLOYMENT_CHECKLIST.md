# Production Deployment Checklist

Last updated: 2026-07-17

Purpose: provide the final operator checklist before Automation Factory is exposed to controlled real-customer Beta traffic.

Scope: deployment readiness only. Do not change AI Runtime, Workflow Engine, Billing Core, Credits Core, or database schema while executing this checklist.

## 1. VPS configuration

- [ ] Production VPS is provisioned and accessible by the deployment operator.
- [ ] OS is Ubuntu 22.04/24.04 or equivalent Linux distribution.
- [ ] Minimum resources are available for controlled Beta: 2 CPU, 4 GB RAM, 20 GB disk.
- [ ] Firewall allows HTTP/HTTPS ingress: `80`, `443`.
- [ ] App runtime port is private to the host or internal network: default `127.0.0.1:3000`.
- [ ] Git is installed.
- [ ] Deployment path exists, recommended: `/www/wwwroot/automation-factory/content-factory`.
- [ ] Log path exists for PM2/Nginx, recommended: `/www/wwwlogs`.

## 2. Node runtime

- [ ] Node.js 24+ is installed.
- [ ] Corepack is enabled.
- [ ] pnpm is available through Corepack or installed explicitly.
- [ ] `node -v`, `corepack --version`, and `pnpm -v` are recorded in the release note.
- [ ] `pnpm install --frozen-lockfile` succeeds.
- [ ] `pnpm build` succeeds on the production server.

## 3. PM2 deployment path

Recommended first launch mode: PM2 + Baota/Nginx.

- [ ] PM2 is installed on the VPS.
- [ ] `ecosystem.config.cjs` uses the correct production `cwd`.
- [ ] PM2 starts `.next/standalone/server.js`.
- [ ] Runtime environment includes `NODE_ENV=production`, `PORT=3000`, and `HOSTNAME=127.0.0.1`.
- [ ] `pm2 status automation-factory` shows `online`.
- [ ] `pm2 logs automation-factory --lines 100` has no startup secret leak or fatal error.
- [ ] `pm2 save` completed after the app is stable.

## 4. Docker deployment path

Use Docker only if the VPS has Docker Engine and the operator chooses container deployment.

- [ ] Docker Engine is installed.
- [ ] Docker Compose plugin is installed.
- [ ] `Dockerfile` builds successfully on the VPS.
- [ ] `docker-compose.yml` loads `.env.production` without committing secrets.
- [ ] `docker compose up -d --build` starts `automation-factory-web`.
- [ ] `docker compose ps` shows a healthy `web` service.
- [ ] Docker healthcheck passes against `/api/health`.

## 5. Nginx reverse proxy

- [ ] Domain points to the VPS public IP.
- [ ] Nginx server block is configured for the production domain.
- [ ] Reverse proxy target is `http://127.0.0.1:3000`.
- [ ] Proxy headers are configured:
  - [ ] `Host`
  - [ ] `X-Real-IP`
  - [ ] `X-Forwarded-For`
  - [ ] `X-Forwarded-Proto`
- [ ] WebSocket upgrade headers are present for future compatibility.
- [ ] Static response compression is enabled when supported.
- [ ] Nginx error log is checked after first request.

## 6. SSL

- [ ] Valid certificate is issued for the production domain.
- [ ] HTTPS endpoint loads successfully.
- [ ] HTTP redirects to HTTPS after initial smoke test passes.
- [ ] Supabase Auth redirect URLs include the production HTTPS domain.
- [ ] `NEXT_PUBLIC_APP_URL` uses the HTTPS production URL.
- [ ] Browser shows a valid certificate chain.

## 7. Environment variables

Use `.env.production.example` as the checklist template. Do not commit real `.env` files.

- [ ] Supabase:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` server-side only
- [ ] App/Auth:
  - [ ] `NEXT_PUBLIC_APP_URL`
  - [ ] `ADMIN_EMAILS`
  - [ ] invite/auth settings required by the selected Beta flow
- [ ] AI providers:
  - [ ] `AI_PROVIDER`
  - [ ] `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`
  - [ ] `AI_IMAGE_PROVIDER`
  - [ ] image provider key if real image generation is promised
  - [ ] `AI_VIDEO_PROVIDER`
  - [ ] video provider key if real video generation is promised
- [ ] Storage:
  - [ ] Supabase storage bucket or accepted local generated-asset mode for single-VPS controlled Beta
- [ ] Payment:
  - [ ] payment variables configured or intentionally disabled for first customer validation
- [ ] Email:
  - [ ] SMTP variables configured or intentionally disabled if Supabase Auth email handles login
- [ ] Webhook/Cron:
  - [ ] `WEBHOOK_SIGNING_SECRET` configured only if external webhooks are active
  - [ ] `CRON_SECRET` configured only if scheduled jobs are active
- [ ] Security:
  - [ ] No private key uses a `NEXT_PUBLIC_` prefix.
  - [ ] `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is not configured.

## 8. Supabase backup

Do not invite customers without a pre-Beta backup.

- [ ] Production project ref is confirmed.
- [ ] Backup is created from Supabase Dashboard or a machine with Docker/`pg_dump`/`DATABASE_URL`.
- [ ] Backup timestamp is recorded.
- [ ] Restore procedure is known and linked to `docs/RESTORE.md`.
- [ ] Storage backup path is confirmed if production assets depend on Supabase Storage.
- [ ] Backup location is access-controlled and not committed to the repository.

## 9. Migration verification

Current required migration baseline: `0032_founder_revenue_validation.sql`.

- [ ] `supabase migration list` points to the correct production project.
- [ ] Remote migrations are applied from `0001` through `0032`.
- [ ] `founder_customer_projects` exists.
- [ ] Beta tables exist:
  - [ ] `beta_invites`
  - [ ] `beta_user_statuses`
  - [ ] `beta_cohorts`
  - [ ] `beta_cohort_members`
  - [ ] `beta_review_notes`
- [ ] Core product tables exist:
  - [ ] `profiles`
  - [ ] `workspaces`
  - [ ] `content_tasks`
  - [ ] `assets`
  - [ ] `credit_transactions`
  - [ ] `usage_history`
- [ ] Generation tables exist:
  - [ ] `image_tasks`
  - [ ] `video_tasks`
  - [ ] `short_drama_assets`
  - [ ] `short_drama_scenes`
- [ ] `/admin/checklist` migration check reports no unexpected ERROR items.

## 10. Release gate

Automation Factory is ready for controlled production Beta only when:

- [ ] VPS runtime is online.
- [ ] Nginx + SSL is online.
- [ ] Production environment variables are configured without committed secrets.
- [ ] Supabase backup exists.
- [ ] Remote migrations are verified through `0032`.
- [ ] `/api/health` passes on the production domain.
- [ ] `/admin/checklist` passes with only accepted WARNING items.
- [ ] Production Smoke Test Checklist passes.
