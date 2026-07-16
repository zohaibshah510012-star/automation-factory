# Changelog

## 2026-07-16

### Image Provider Beta E2E

- Enabled Image Provider configuration in environment templates.
- Upgraded the existing local image provider from `mock://` URLs to real generated SVG files saved under generated assets.
- Added a generated asset route so runtime-created files are accessible in standalone production preview.
- Confirmed image workflow creates `image_tasks`, mirrors into `content_tasks`, saves an image asset, commits Credits, records usage, and appears to Admin task operations.
- Increased OpenAI request timeout template to support slower image generation calls.
- Confirmed OpenAI and Gemini external image calls currently time out from this local machine; local provider is used as the Beta-safe image workflow fallback.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed
- Image E2E: passed with `AI_IMAGE_PROVIDER=local`

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
