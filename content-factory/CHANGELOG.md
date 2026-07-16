# Changelog

## 2026-07-16

### Beta User Path E2E Verification

- Verified invited Beta user flow from invite validation through bootstrap, workspace creation, task creation, task result, credits settlement, usage tracking, feedback, and admin visibility.
- Confirmed text generation completes with the configured DeepSeek provider.
- Confirmed image and video endpoints return explicit provider configuration errors when dedicated providers are not configured.
- Confirmed credits reserve/commit and `usage_history` records are created for successful generation.
- Confirmed Admin operations endpoints for users, tasks, analytics, health, monitor, feedback, and beta invites are reachable with admin authorization.
- Applied existing Supabase migration `0027_beta_experiment_tracking.sql` to the remote database so `feedback_submitted` events are accepted by `product_events`.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed

