# Changelog

## 2026-07-17

### Beta Operations & User Validation

- Added migration `0029_beta_operations.sql` with admin-only `beta_user_statuses`.
- Added Beta operational statuses: `invited`, `active`, `completed`, and `churned`.
- Enhanced `/admin/beta-insights` with per-user registration time, first generation time, Time To First Value, latest activity, workflows used, Credits consumed, feedback status, and manual Beta status updates.
- Added audit logging for Beta user status changes.
- Added activation funnel metrics for signup, workspace creation, first generation start, first generation completion, and feedback submission.
- Added Feedback Intelligence for content quality, generation speed, usability, use cases, payment intent, average rating, recommendation rate, and common issues.
- Updated production diagnostics and checklists to require migration `0029_beta_operations.sql`.
- Simplified the generated asset route to the scoped `public/generated` runtime path, removing the Turbopack NFT tracing warning.
- Applied migration `0029_beta_operations.sql` to the linked Supabase project and confirmed migrations `0001` through `0029`.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed without the previous generated asset route tracing warning.
- `beta_user_statuses`: reachable on the linked Supabase project.

### Beta Launch Preparation

- Fixed local fallback cost attribution so usage and cost reporting no longer inherit `deepseek/deepseek-chat` from Agent pricing when the runtime uses local fallback providers.
- Recorded text fallback usage as `local-text-provider / local-content-pack`.
- Recorded image fallback usage as `local-image-provider / local-svg-image`.
- Recorded video fallback usage as `local-video-provider / local-svg-video-preview`.
- Added local fallback providers to the Admin cost overview aggregation defaults.
- Confirmed existing Demo Templates cover AI Short Drama, Product Advertisement, and Social Media Content Beta Launch Pack needs.
- Confirmed migration status remains `0001` through `0028` applied on the linked Supabase project.
- Confirmed server-only service role handling, no `NEXT_PUBLIC` service-role key usage, generation daily limits, and existing rate limits on Beta invite verification and analytics events.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed with existing Next/Turbopack NFT tracing warning for the generated asset route.
- Local smoke: `/api/health` returned `200` with database `true`.
- Text smoke: completed with `usage_history` and `ai_provider_costs` provider/model `local-text-provider / local-content-pack`.
- Image smoke: completed with `usage_history` and `ai_provider_costs` provider/model `local-image-provider / local-svg-image`.
- Video smoke: completed with `usage_history` and `ai_provider_costs` provider/model `local-video-provider / local-svg-video-preview`.

### Beta Dry Run

- Applied `0028_beta_validation_readiness.sql` to the target Supabase project with `supabase db push`.
- Confirmed remote migrations are applied from `0001` through `0028`.
- Created and consumed a Demo invite user and an ordinary Beta test user.
- Verified Invite -> Register/Login -> Bootstrap -> Workspace -> Short Drama Generate -> Result -> Assets -> Feedback.
- Confirmed the Short Drama test task completed and saved 4 image assets plus 5 video preview assets.
- Confirmed Credits changed from `1000` to `320` for the full Short Drama package including child media tasks.
- Confirmed Beta events, feedback, Admin users, Admin tasks, Admin analytics, and Admin feedback visibility.
- Recorded the remaining cost-attribution caveat: local Beta generation still reports usage provider/model from the existing Agent pricing configuration.

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
