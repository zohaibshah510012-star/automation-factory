# Active Work

Last updated: 2026-07-17

## Current sprint

Production Verification

## Current phase

Production verification for controlled real-customer Beta.

## Completed in this phase

- Assessed whether AI-Company can enter Beta independently from other server assets.
- Created `docs/AI_COMPANY_PRODUCTION_ISOLATION_REPORT.md`.
- Aligned production migration baseline references to `0032_founder_revenue_validation.sql`.
- Added `docs/PRODUCTION_DEPENDENCY_CHECKLIST.md`.
- Added `docs/PRODUCTION_SMOKE_TEST_PLAN.md`.
- Verified remote Supabase migrations `0001` through `0032` with `supabase migration list`.
- Verified required Supabase tables for revenue, beta, credits, usage, tasks, and assets are reachable.
- Confirmed no runtime dependency was found on afeng MySQL.
- Confirmed Redis is not a current runtime dependency; it is reserved only for future Docker profiles.
- Confirmed no dependency was found on AIXHub or Yuedong / 悦动.
- Identified required external dependencies for isolated Beta:
  - Supabase
  - VPS / PM2 or Docker runtime
  - domain / Nginx / SSL
  - selected AI provider credentials
- Identified production blockers:
  - Supabase backup could not be created from this workstation because Docker and `pg_dump` are unavailable and `DATABASE_URL` is not configured
  - production environment variables must be configured on the VPS before Beta traffic
  - production smoke test must pass on the VPS before inviting real customers
  - VPS runtime could not be verified because no production SSH host/domain/runtime access context is available in this workspace

## Not done

- No server changes.
- No AI Runtime, Workflow Engine, Billing Core, Credits Core, or database schema changes.
- No database changes.
- No Supabase migration push.
- No production smoke test was executed.

## Next execution action

Run the production VPS verification pass from a machine with production access:

1. Configure production environment variables on the VPS.
2. Create or confirm a pre-Beta Supabase backup from Supabase Dashboard or a machine with Docker/`pg_dump`/`DATABASE_URL`.
3. Start PM2 or Docker runtime behind Nginx and SSL.
4. Run `/api/health`, `/admin/checklist`, `/brief`, workflow generation, assets, feedback, and `/admin/revenue` smoke tests.
5. Invite the first 1-2 controlled Beta users only after the smoke test passes.
