# Active Work

Last updated: 2026-07-17

## Current sprint

Production Launch Readiness

## Current phase

Production operations preparation for controlled real-customer Beta.

## Completed in this phase

- Assessed whether AI-Company can enter Beta independently from other server assets.
- Created `docs/AI_COMPANY_PRODUCTION_ISOLATION_REPORT.md`.
- Aligned production migration baseline references to `0032_founder_revenue_validation.sql`.
- Added `docs/PRODUCTION_DEPENDENCY_CHECKLIST.md`.
- Added `docs/PRODUCTION_SMOKE_TEST_PLAN.md`.
- Confirmed no runtime dependency was found on afeng MySQL.
- Confirmed Redis is not a current runtime dependency; it is reserved only for future Docker profiles.
- Confirmed no dependency was found on AIXHub or Yuedong / 悦动.
- Identified required external dependencies for isolated Beta:
  - Supabase
  - VPS / PM2 or Docker runtime
  - domain / Nginx / SSL
  - selected AI provider credentials
- Identified production blockers:
  - production Supabase migration state must be verified through `0032`
  - production environment variables and backup must be verified before Beta traffic
  - production smoke test must pass on the VPS before inviting real customers

## Not done

- No server changes.
- No AI Runtime, Workflow Engine, Billing Core, Credits Core, or database schema changes.
- No database changes.
- No Supabase migration push.

## Next execution action

Run the production VPS verification pass:

1. Verify target Supabase migration state through `0032`.
2. Configure production environment variables on the VPS.
3. Run `/api/health`, `/admin/checklist`, `/brief`, workflow generation, assets, feedback, and `/admin/revenue` smoke tests.
4. Create or confirm a pre-Beta Supabase backup.
5. Invite the first 1-2 controlled Beta users only after the smoke test passes.
