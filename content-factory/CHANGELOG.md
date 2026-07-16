# Changelog

## 2026-07-17

### Beta Validation Readiness

- Added migration `0028_beta_validation_readiness.sql` for Beta workflow events and richer feedback fields.
- Added product events for `workflow_created`, `first_workflow_created`, and `generation_failed`.
- Added workflow type, task id, duration, provider, Credits, and failure reason metadata to generation success/failure tracking where available.
- Enhanced user feedback with result quality score, use case, and continue-use intent.
- Updated Admin Feedback to show quality, use case, and continue-use signals.
- Enhanced Admin Analytics with workflow usage, workflow success rate, average generation cost, Credits consumed, and feedback distribution for Beta testing.
- Updated production readiness/checklist docs to reference migration `0028_beta_validation_readiness.sql`.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed

### Distribution MVP

- Added a safe publishing-prep layer for TikTok, YouTube Shorts, and Xiaohongshu without external platform posting.
- Added authenticated distribution job listing and creation through `/api/distributions`.
- Added `/api/distributions/[id]/export` to return a manual publishing package with content summary, assets, platform notes, and checklist.
- Replaced `mock://` distribution output with internal export package URLs.
- Added ownership validation so users can only create distribution jobs for their own content tasks.
- Kept Admin distribution visibility through the existing Admin distribution APIs/pages.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed
- Distribution smoke: passed against local production preview.
- Verified distribution job creation, `published` status, internal export URL, export route `200`, payload version `distribution-mvp-v1`, and exported asset list.

### Short Drama MVP

- Completed the Short Drama MVP vertical path from Create Center to Short Drama Result page.
- Linked drama scene image/video generation back into `short_drama_scenes`.
- Saved generated scene image and video preview assets onto the parent drama task so `/tasks/[id]` and `/assets` show the full content package.
- Updated the Short Drama Result page to show story, characters, scenes, generated images, generated video previews, prompts, progress, asset navigation, and feedback CTA.
- Preserved story, characters, and scenes across incremental drama asset writes.
- Redirected Short Drama creation from `/create` to `/dashboard/studio/[taskId]`.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed

### SaaS Operating Layer

- Enhanced `/api/admin/overview` with provider readiness, Beta activation rate, feedback queue health, task counts, Credits usage, and provider summaries.
- Confirmed the existing Admin operating layer covers users, tasks, analytics, beta insights, feedback, health, monitor, and provider readiness.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed
- Short Drama E2E: passed with local text/image/video providers.
- Verified drama task completion, 4 completed scenes, 4 image assets, 5 video assets, generated asset routes, Credits deduction, `/dashboard/studio/[taskId]`, `/tasks/[taskId]`, `/assets`, and Admin dramas/tasks visibility.

### Production Provider Readiness

- Added Admin Provider readiness dry-run API for text, image, and video capability configuration.
- Confirmed existing provider adapters cover OpenAI/Flux for images and Kling/Runway for video routing.
- Improved Flux, Kling, and Runway error messages to include HTTP status and a short provider response body.
- Verified `/api/admin/providers/test` returns capability readiness without triggering paid provider generation.

### Beta Experience Polish

- Improved Create Center error states for insufficient Credits, provider configuration, login/invite issues, and oversized prompts.
- Kept the first-session path focused on Dashboard -> Create -> Template -> Generate -> Result -> Assets -> Feedback.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed

### Video Provider Beta E2E

- Enabled the existing local video provider as a Beta-safe workflow fallback with real generated preview files instead of `mock://` URLs.
- Saved local video preview assets under `/generated/[taskId]/video-preview.svg` so standalone production preview can serve the result.
- Updated Video Detail, Video List, Task Result, and My Assets pages to render local video preview assets while preserving normal `<video>` playback for real provider URLs.
- Documented `AI_VIDEO_PROVIDER=local` in environment templates and kept Runway/Kling as the intended production video providers.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed
- Video E2E: passed with `AI_VIDEO_PROVIDER=local`
- Verified `/api/videos`, `/tasks/[id]`, `/dashboard/videos/[id]`, `/assets`, generated asset route, Credits deduction, `usage_history`, asset persistence, Admin task access `200`, and non-admin Admin access `403`.

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
