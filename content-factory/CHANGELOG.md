# Changelog

## 2026-07-17

### Supabase Backup PITR Closure Runbook

- Added `docs/SUPABASE_BACKUP_CLOSURE_RUNBOOK.md`.
- Documented the Supabase Dashboard Backup Checklist with project name, backup status, PITR status, creation time, operator, and backup location evidence fields.
- Documented the Restore Drill Checklist for isolated restore environment, database restore, migration verification, core table verification, and post-restore health checks.
- Listed required restore verification tables: `profiles`, `workspaces`, `content_tasks`, `assets`, `credit_transactions`, `usage_history`, and `founder_customer_projects`.
- Updated `docs/BETA_P0_EXECUTION_STATUS.md` to reference the closure runbook while keeping Backup/PITR Restore as `BLOCKED` until real backup and restore evidence exists.
- Preserved AI Runtime, Workflow Engine, Billing Core, Credits Core, and database schema.

### Close Beta P0 Readiness Gates

- Added `docs/AUTH_BETA_ACCESS_VERIFICATION.md`.
- Verified controlled Auth/Beta Access against linked Supabase `rfghzowaeqojvnxiqznc` and local production preview `http://127.0.0.1:3001`.
- Confirmed invite creation, invite verification, user creation, login, bootstrap/profile, invite consumption, workspace creation, dashboard load, customer admin denial, and uninvited-user block.
- Added `docs/BACKUP_PITR_VERIFICATION.md`.
- Confirmed Backup/PITR remains blocked: Supabase CLI returned `pitr_enabled=false` and `backups=null`.
- Confirmed this workstation still lacks Docker, `pg_dump`, and `DATABASE_URL`, so it cannot create or restore-validate a database dump locally.
- Updated Closed Beta gate: Auth Ready and Beta User Created are checked; Backup Ready, Restore Verified, and Production Smoke Test Passed remain unchecked.
- Preserved AI Runtime, Workflow Engine, Billing Core, Credits Core, and database schema.

### Beta P0 Execution Readiness

- Added `docs/BETA_P0_EXECUTION_STATUS.md`.
- Recorded Closed Beta as `NOT READY`.
- Recorded `Auth/Beta Access` as `BLOCKED` pending production owner assignment, production invite/auth execution, and acceptance evidence.
- Recorded `Backup/PITR Restore` as `BLOCKED` pending backup owner assignment, pre-Beta backup creation, PITR/restore validation, and acceptance evidence.
- Added the Closed Beta gate checklist: Auth Ready, Backup Ready, Restore Verified, Production Smoke Test Passed, and Beta User Created.
- Noted that `docs/BETA_P0_EXECUTION_CHECKLIST.md` was requested as input but is not present in the repository.
- Preserved AI Runtime, Workflow Engine, Billing Core, Credits Core, and database schema.

### Production Launch Preparation

- Added `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md` with VPS, Node runtime, PM2/Docker, Nginx, SSL, environment variable, Supabase backup, and migration verification gates.
- Added `docs/PRODUCTION_LAUNCH_RUNBOOK.md` with clone, dependency install, env configuration, database check, backup, build, PM2/Docker start, Nginx/SSL, health check, and rollback steps.
- Added `docs/PRODUCTION_SMOKE_TEST_CHECKLIST.md` covering `/`, auth entry, `/dashboard`, `/create`, Text generation, Image generation, Video preview, Assets, Feedback, Customer Brief, and Admin checks.
- Updated `docs/PROJECT_STATUS.md` to clarify that Beta product capability is complete and production deployment verification remains the current launch blocker.
- Preserved AI Runtime, Workflow Engine, Billing Core, Credits Core, and database schema.

### VPS Production Verification

- Verified remote Supabase migrations are aligned from `0001` through `0032`.
- Verified required Supabase tables for Founder revenue, Beta operations, Credits, usage, tasks, and assets are reachable.
- Confirmed `.env.production.example` covers required production variable groups without committing secrets.
- Attempted Supabase CLI backup, but backup creation was blocked because Docker is not installed, `pg_dump` is unavailable, and `DATABASE_URL` is not configured on this workstation.
- VPS runtime and production smoke tests were not executed because no production SSH host/domain/runtime access context was available in this workspace.
- Preserved AI Runtime, Workflow Engine, Billing Core, Credits Core, and database schema.

### Production Ops Preparation

- Aligned production migration baseline documents to `0032_founder_revenue_validation.sql`.
- Updated production diagnostics used by `/admin/checklist` to expect migration `0032` and verify `founder_customer_projects`.
- Added `docs/PRODUCTION_DEPENDENCY_CHECKLIST.md` with required, conditional, and explicit non-dependencies.
- Added `docs/PRODUCTION_SMOKE_TEST_PLAN.md` covering `/api/health`, `/admin/checklist`, `/brief`, `/dashboard`, `/create`, Text/Image/Video fallback, `/tasks/[id]`, `/assets`, `/dashboard/feedback`, and `/admin/revenue`.
- Confirmed `.env.production.example` covers Supabase, AI provider keys, admin/auth config, storage, payment, webhook, cron, and proxy variables without committing `.env` files.
- Preserved AI Runtime, Workflow Engine, Billing Core, Credits Core, and database schema.
- Validation passed: `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`.

### Production Isolation Assessment

- Added `docs/AI_COMPANY_PRODUCTION_ISOLATION_REPORT.md`.
- Assessed whether AI-Company can enter Beta independently from other server assets.
- Confirmed no runtime dependency was found on afeng MySQL.
- Confirmed Redis is not a current runtime dependency and is only reserved in Docker Compose future profiles.
- Confirmed no dependency was found on AIXHub or Yuedong / 悦动.
- Identified Supabase, VPS runtime, domain/Nginx/SSL, and selected AI provider credentials as the minimum isolated Beta dependencies.
- Identified must-fix production operations items before Beta traffic: migration docs must align to `0032`, production Supabase must be verified through `0032`, production env must be configured, backup must exist, and production smoke tests must pass.
- Added `ACTIVE_WORK.md` to record the current production isolation phase and next action.
- No server, code, or database changes were made.

### Customer Brief Intake

- Added `/brief` as a Chinese customer-facing commercial Brief intake page.
- Added `/api/brief` so authenticated customers can submit company/brand, product, product introduction, target customer, marketing goal, platform selection, and material links/notes.
- Brief submissions now create `founder_customer_projects` rows with `status = planned`, allowing Founder to review customer project drafts from `/admin/revenue`.
- Kept upload as material links/notes for the MVP because no customer-facing Storage upload flow existed in the current product path.
- Preserved AI Runtime, Workflow Engine, Billing Core, Credits Core, Provider, and database core behavior.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed

### Founder Revenue Validation

- Added migration `0032_founder_revenue_validation.sql` with admin-only `founder_customer_projects`.
- Added `/api/admin/revenue` for Founder customer project records, Revenue Validation metrics, Demo Case creation, and project status updates.
- Added `/admin/revenue` as the Revenue Validation View for project count, workflow usage, generation count, AI cost, Credits used, delivered assets, and project status.
- Added a Founder Demo Case flow that records product information, commercial need, Marketing Strategy, Script, Image Assets, Video Preview, and Distribution Package as a sellable delivery path.
- Preserved existing Beta, AI Runtime, Workflow Engine, Billing Core, Credits Core, Provider, and Workflow behavior.

### Founder Revenue Validation Execution

- Applied and confirmed Supabase migrations through `0032_founder_revenue_validation.sql`.
- Created the first Founder Demo Case for `Founder Demo` / `AI Marketing Content Package`.
- Ran the existing Short Drama workflow as the commercial demo production path.
- Generated and linked 16 assets: 8 image assets and 8 video preview assets.
- Created the Distribution MVP export package at `/api/distributions/d2354a6e-d99b-42e6-88ca-572f578c2e3b/export`.
- Backfilled `founder_customer_projects` with linked task IDs, generated assets, deliverables, Credits used, estimated AI cost, and result notes.
- Marked the Founder Demo Case as `ready_to_sell`.
- Verified `/admin/revenue` returns `200` and `/api/health` reports database `true` in local production preview.

### Chinese Customer-Facing Usability

- Localized the main customer-facing product path to Chinese for China-based customers.
- Updated Dashboard, Create / Workflow Wizard, Workflow Templates, Task Result, Short Drama Result, Assets, Feedback, and Founder Revenue Validation copy.
- Localized workflow template names, descriptions, example inputs, estimated outputs, outcomes, status labels, CTA labels, empty states, and error guidance.
- Preserved existing AI Runtime, Workflow Engine, Billing Core, Credits Core, Provider, and database behavior.

### Founder Beta Cohort 1 Execution

- Ran the initial clean cohort monitoring check for `Founder Beta Cohort 1`.
- Confirmed the cohort is `running` with target users `5`.
- Confirmed `beta_cohort_members` is still `0`, so no clean real-user Beta metrics are available yet.
- Confirmed the current clean cohort metrics are intentionally zero instead of polluted by historical smoke/dev rows.
- Did not auto-bind users, add features, or change code.
- Did not create a commit because no P0/P1 repair was made.

### Founder Beta Cohort Data Cleanup

- Added migration `0031_founder_beta_data_cleanup.sql` for additive task timing fields and cohort member query support.
- Applied remote Supabase migrations through `0031`.
- Changed `/api/admin/founder` to default Founder metrics to active cohort members instead of historical invite/profile smoke data.
- Added Admin Founder cohort binding by email, writing explicit `beta_cohort_members` rows with audit logging.
- Added `/admin/founder` cohort-only warning, candidate user binding controls, and Active Cohort Members visibility.
- Scoped Founder review notes, feedback themes, failed tasks, Credits, workflow usage, and latency metrics to the active cohort.
- Added new-task duration recording for text/content, image, and video generation paths.
- Added `usage_history.duration_ms` writes for new completed tasks.
- Preserved historical data and did not auto-bind users without an authoritative real-user list.

### Validation

- `supabase db push`: applied `0031_founder_beta_data_cleanup.sql`.
- `supabase migration list`: confirmed `0001` through `0031`.
- `pnpm lint`: passed.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm build`: passed.

### Founder Beta Operation Cycle

- Ran a monitoring-only Beta operation cycle against the linked Supabase project.
- Confirmed the running Founder Beta Cohort, invite distribution, signup/workspace/first-generation/feedback events, workflow usage, task completion, Credits consumption, feedback score, and payment signals.
- Confirmed no new P0 blocker in the current monitoring snapshot.
- Recorded the data caveat that remote rows still include historical smoke/dev users and are not yet clean external-user evidence.
- Did not introduce a code fix or create a commit in this cycle.

### Founder Beta Execution

- Kept the Beta Execution scope limited to live-user operations support; no new AI model, provider, workflow, or publishing capability was added.
- Enhanced `/api/admin/founder` with system monitoring metrics for failed tasks, provider errors, average generation latency, P95 generation latency, and Credits consumption.
- Enhanced `/api/admin/founder` with Quality Issue detection from low result-quality feedback and result-quality review notes.
- Enhanced `/admin/founder` with System Ops cards and a Quality Issues section so the Founder can review user funnel, system blockers, and feedback signals from one page.
- Verified remote Supabase migrations remain applied through `0030_founder_beta_run.sql`.
- Queried remote Beta operation data and confirmed the current cohort is running with invite, signup, generation, credits, and feedback data present.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed

### Founder Beta Run

- Added migration `0030_founder_beta_run.sql` with admin-only `beta_cohorts`, `beta_cohort_members`, and `beta_review_notes`.
- Added `/api/admin/founder` to aggregate Founder Beta Run metrics for invited, registered, activated, completed, first-generation rate, completion rate, Time To First Value, most-used workflow, Credits used, estimated cost, feedback score, result quality, and upgrade-interest signals.
- Added `/admin/founder` as the Founder View for a 5-user Beta cohort, Demo Invite handoff, recommended Short Drama test workflow, 1/5/10-minute experience goals, and Beta Review Notes.
- Added Beta Review Notes workflow for feedback, needs, bugs, feature requests, and business signals with `open`, `reviewing`, and `resolved` status tracking.
- Added Founder Beta monitoring for launch checklist, failed generations, recent error logs, blocking points, feedback categories, pain points, feature requests, and payment signals.
- Updated production diagnostics, deployment docs, production checklist, final launch checklist, smoke test, and project status to reference `0030_founder_beta_run.sql`.
- Applied migration `0030_founder_beta_run.sql` to the linked Supabase project and confirmed migrations `0001` through `0030`.
- Created default remote cohort `Founder Beta Cohort 1` with target users `5`.

### Validation

- `pnpm lint`: passed
- `pnpm exec tsc --noEmit`: passed
- `pnpm build`: passed

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
