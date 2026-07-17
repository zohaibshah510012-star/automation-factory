# Production Dependency Checklist

Last updated: 2026-07-17

Purpose: define the minimum production dependencies required before inviting real customers to Automation Factory Beta.

## Required dependencies

| Dependency | Status | Required for | Verification |
| --- | --- | --- | --- |
| Supabase | Required | Auth, Postgres, RLS, service-role writes, migrations, storage checks | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `supabase migration list` through `0032` |
| VPS | Required | Production runtime | Linux host available with Node.js 24+, Git, pnpm/Corepack |
| PM2 or Docker | Required | Process manager | PM2 recommended for first Baota launch; Docker remains an alternate path |
| Nginx | Required | Reverse proxy | Proxy to `127.0.0.1:3000`, gzip, WebSocket headers, security headers |
| SSL | Required | Customer-facing HTTPS | Valid certificate and HTTPS domain response |
| AI text provider | Required | Text generation and Short Drama script generation | `AI_PROVIDER` plus `DEEPSEEK_API_KEY` or `OPENAI_API_KEY` |
| Admin bootstrap | Required | Founder operations | `ADMIN_EMAILS` includes founder/admin email |

## Conditionally required dependencies

| Dependency | Required when | Current Beta stance |
| --- | --- | --- |
| OpenAI / Flux / Gemini image provider | Real image quality is promised | Optional for controlled Beta because local image fallback exists |
| Kling / Runway video provider | Real video quality is promised | Optional for controlled Beta because local video preview fallback exists |
| Supabase Storage | Durable cloud asset storage is required | Recommended before larger Beta; local generated assets are acceptable only for single-VPS controlled Beta |
| Stripe / PayPal | Real paid checkout is enabled | Not required for first customer validation unless charging inside the app |
| SMTP | Transactional app email is required beyond Supabase Auth | Optional warning for first Beta |
| Webhook signing secret | External webhooks are enabled | Optional warning unless payment/provider webhooks are active |
| Cron secret | Scheduled jobs are enabled | Optional warning until cron/worker jobs are activated |

## Explicit non-dependencies

The current codebase and deployment files do not require:

- afeng
- MySQL
- Redis
- AIXHub

Notes:

- Redis appears only in the `docker-compose.yml` `future` profile and deployment docs as an optional future queue dependency.
- The app runtime uses managed Supabase/Postgres through `@supabase/supabase-js`, not MySQL.
- Provider configuration references DeepSeek, OpenAI, Gemini, Flux, Runway, Kling, and local fallbacks; no AIXHub dependency was found.

## Minimum production dependency gate

Automation Factory can invite the first controlled real customers only after:

1. Production Supabase migrations are confirmed through `0032_founder_revenue_validation.sql`.
2. Production environment variables are configured without committing `.env` files.
3. PM2 + Nginx + SSL or Docker + Nginx + SSL is running.
4. `/api/health` returns healthy database status.
5. `/admin/checklist` has no unexpected ERROR items.
6. A pre-Beta Supabase backup exists.

## Environment template validation

Checked against `.env.production.example` on 2026-07-17.

Required production groups are represented:

- Supabase URL and keys
- Admin/auth gate
- Text, image, and video AI provider selection
- DeepSeek/OpenAI/Gemini/Flux/Runway/Kling provider keys
- Payment variables
- Email variables
- Storage bucket
- Webhook secret
- Cron secret
- Optional outbound proxy variables

Intentional omission:

- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is not in `.env.production.example`.
- This is correct. The code only checks this name as a security leak detector; it must never be configured.
