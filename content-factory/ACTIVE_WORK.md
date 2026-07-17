# Active Work

Last updated: 2026-07-17

## Current sprint

Founder Customer Acquisition / Production Isolation

## Current phase

Production isolation assessment for Beta readiness.

## Completed in this phase

- Assessed whether AI-Company can enter Beta independently from other server assets.
- Created `docs/AI_COMPANY_PRODUCTION_ISOLATION_REPORT.md`.
- Confirmed no runtime dependency was found on afeng MySQL.
- Confirmed Redis is not a current runtime dependency; it is reserved only for future Docker profiles.
- Confirmed no dependency was found on AIXHub or Yuedong / 悦动.
- Identified required external dependencies for isolated Beta:
  - Supabase
  - VPS / PM2 or Docker runtime
  - domain / Nginx / SSL
  - selected AI provider credentials
- Identified production blockers:
  - production docs still reference migration `0030` while local migrations now run through `0032`
  - production Supabase migration state must be verified through `0032`
  - production environment variables and backup must be verified before Beta traffic

## Not done

- No server changes.
- No code changes.
- No database changes.
- No Supabase migration push.

## Next execution action

Run a production operations prep pass:

1. Align production baseline docs from `0030` to `0032`.
2. Verify target Supabase migration state through `0032`.
3. Configure production environment variables on the VPS.
4. Run `/api/health`, `/admin/checklist`, `/brief`, workflow generation, assets, feedback, and `/admin/revenue` smoke tests.
5. Invite the first 1-2 controlled Beta users only after the smoke test passes.
