# Automation Factory Project Status

Last updated: 2026-07-17

## Current phase

Beta Product Completion Sprint - Phase 5 Distribution MVP completed.

The current product direction is to make Automation Factory usable as a first-session AI SaaS: a new invited user should be able to sign in, land on Dashboard, choose a workflow template, create a task, view the Task Result page, and submit feedback without engineering support.

## Latest verified commit before this report

`5eecb612bee817f3fa44fd66fee24d48572388d7`

## Verified user path

The following path was verified against the local production preview on `http://127.0.0.1:3001` with the correct Supabase environment injected into the standalone server process:

1. Beta invite exists and `/api/beta/invites/verify` accepts the invited email/code.
2. Test user can log in through Supabase Auth.
3. `/api/auth/bootstrap` creates/updates the profile and consumes the invite.
4. `/api/workspaces` creates and lists the first workspace.
5. `/dashboard`, `/create`, `/dashboard/templates`, `/tasks/[id]`, and `/assets` return `200`.
6. `/api/tasks` creates a content task.
7. The task reaches `completed`.
8. `content_tasks` persists the result.
9. Credits are reserved and committed.
10. `usage_history` records the consumed credits and provider.
11. `/api/feedback` accepts user feedback.
12. Admin APIs can read users, tasks, analytics, health, monitor, feedback, and beta invites.

## E2E result

Pass after migration sync.

Important observed data:

- Text provider: `deepseek`
- Completed test task status: `completed`
- Credits before generation: `1000`
- Credits after generation: `975`
- Credits charged: `25`
- Usage provider/model: `deepseek / deepseek-chat`
- Feedback submission: `201`
- Admin API checks: `200`

## Supabase migration status

Local migrations currently run from `0001` through `0027`.

Remote Supabase was found at `0026` during E2E. `0027_beta_experiment_tracking.sql` was applied with `supabase db push`.

Remote now reports:

- `0001` through `0027`: applied

This fixed missing `feedback_submitted` product analytics events. Before `0027` was applied, feedback rows were saved but the analytics event was rejected by the older `product_events_event_name_check` constraint.

## Provider status

Text generation is usable with the current `AI_PROVIDER=deepseek` configuration.

Image generation is now usable in the local Beta environment with `AI_IMAGE_PROVIDER=local`.

The local provider now writes a real generated SVG file, persists the image task, mirrors it into `content_tasks`, stores an image asset, and commits Credits. This is a Beta-safe fallback for first-user image workflow validation when external provider networking is unavailable.

OpenAI and Gemini image provider adapters remain available, but local smoke tests against both external services failed from this machine with provider/network timeouts. Production can switch to `AI_IMAGE_PROVIDER=openai`, `gemini`, or `flux` after the target server network and provider account are confirmed.

Video generation is now usable in the local Beta environment with `AI_VIDEO_PROVIDER=local`.

The local video provider writes a real generated SVG preview file, persists the video task, mirrors it into `content_tasks`, stores a video asset, and commits Credits. This gives Beta users a complete product path without returning `mock://` URLs.

Runway and Kling provider adapters remain available for production video generation. Production should switch to `AI_VIDEO_PROVIDER=runway` or `AI_VIDEO_PROVIDER=kling` after provider account credentials, network access, response schema, and cost limits are confirmed.

## Credits status

Credits behavior passed the E2E check:

- New Beta test user had trial credits.
- Task creation/generation reserved credits.
- Successful generation committed the reservation.
- `usage_history` recorded the charge.

No changes were made to Billing Core or Credits core functions.

Image Credits behavior also passed:

- Image workflow test user started with `1000` Credits.
- Image task charged `40` Credits.
- Final balance was `960`.
- `credit_transactions` showed reserve committed.
- `usage_history` recorded provider/model `local / local-svg-image`.

Video Credits behavior passed:

- Video workflow test user started with `1000` Credits.
- Video task charged `100` Credits.
- Final balance was `900`.
- `usage_history` recorded provider/model `local / local-svg-video-preview`.

## Admin operations status

Verified admin endpoints:

- `/api/admin/users`
- `/api/admin/tasks`
- `/api/admin/analytics`
- `/api/admin/health`
- `/api/admin/monitor`
- `/api/admin/feedback`
- `/api/admin/beta/invites`

## Documentation gap

The user requested reading these documents before execution:

- `docs/PROJECT_STATUS.md`
- `docs/AI_COMPANY_MEMORY.md`
- `docs/ROADMAP.md`
- `docs/CODEX_WORKFLOW.md`

Only `docs/PROJECT_STATUS.md` is being created in this change because it was explicitly required as an update target. The other three files were not present in the repository at verification time.

## Current Beta readiness

Beta user path is ready for invited text-generation users, local image workflow users, and local video workflow users.

Short Drama MVP is now usable as a complete Beta content-production path:

- User enters a story/product/creative idea from Create Center.
- Short Drama task generates story, characters, scenes, image prompts, and video prompts.
- Existing local Image Provider creates scene image assets.
- Existing local Video Provider fallback creates scene video preview assets.
- Short Drama Result page shows story, characters, scene media, prompts, progress, assets, and feedback/assets next actions.
- Main drama task, scene tasks, assets, Credits, and Admin visibility were verified.

Production Provider upgrade status:

- OpenAI and Flux image provider adapters are available through `AI_IMAGE_PROVIDER`.
- Kling and Runway video provider adapters are available through `AI_VIDEO_PROVIDER`.
- Admin Provider readiness API now checks text/image/video configuration without triggering paid generation.
- Flux/Kling/Runway errors now include HTTP status and response summaries for production debugging.
- Current local machine readiness: text `deepseek` configured, image `local` Beta fallback ready, video provider not configured unless `AI_VIDEO_PROVIDER` is injected into the runtime environment.

Beta experience polish status:

- Create Center now gives clearer user-facing recovery messages for insufficient Credits, provider configuration issues, invite/login issues, and oversized prompts.
- The primary first-session path remains: Dashboard -> Create -> Template -> Generate -> Result -> Assets -> Feedback.
- Short Drama creation now opens the dedicated Short Drama Result page.

SaaS operating layer status:

- `/admin/analytics` provides revenue, Credits, provider cost, funnel, Beta, and feedback metrics.
- `/admin/beta-insights` provides lifecycle status, Beta Health Score, active users, likely-to-pay users, at-risk users, retention, and revenue-readiness signals.
- `/api/admin/overview` now includes provider readiness, Beta activation rate, feedback queue health, task counts, Credits usage, and provider summaries for lightweight operations dashboards.

Distribution MVP status:

- User-owned completed content can create distribution preparation jobs through `/api/distributions`.
- Supported Beta platforms are `tiktok`, `youtube`, and `xiaohongshu`; `mock` remains available for internal compatibility.
- Distribution jobs now generate an internal export package URL at `/api/distributions/[jobId]/export`.
- Export packages include content summary, script/storyboard, saved assets, platform notes, and a manual publishing checklist.
- Distribution creation validates that the requested `contentId` belongs to the authenticated user before creating a job.
- Admin can view distribution jobs through the existing Admin distribution pages and APIs.
- This is a safe Beta publishing-prep layer, not real external platform posting.

Latest Image E2E result:

- `/api/images`: created task successfully.
- `image_tasks.status`: `completed`.
- `content_tasks.status`: `completed`.
- Generated image URL: `/generated/[taskId]/image.svg`.
- Generated image route: `200`.
- Image asset row: created.
- Credits: committed and deducted.
- Admin task visibility: verified.

Latest Video E2E result:

- `/api/videos`: created task successfully.
- `video_tasks.status`: `completed`.
- `content_tasks.status`: `completed`.
- Generated video preview URL: `/generated/[taskId]/video-preview.svg`.
- Generated preview route: `200`.
- Video asset row: created.
- Credits: committed and deducted.
- Task Result page: `200`.
- Video detail page: `200`.
- Assets page: `200`.
- Admin task visibility: verified with admin `200`; normal user received `403`.

Latest Short Drama MVP E2E result:

- `/api/tasks` with `taskType=drama`: created task successfully.
- `content_tasks.status`: `completed`.
- `short_drama_assets.status`: `completed`.
- `short_drama_scenes`: 4 scenes completed.
- Main drama assets: 4 image assets and 5 video assets saved.
- Generated asset routes: `200`.
- Credits: `1000 -> 320` in the local Beta smoke test.
- `/dashboard/studio/[taskId]`: `200`.
- `/tasks/[taskId]`: `200`.
- `/assets`: `200`.
- Admin dramas/tasks APIs: `200`.

Latest Distribution MVP smoke result:

- Local production preview started on `http://127.0.0.1:3001`.
- `/api/distributions`: created a TikTok distribution preparation job.
- `distribution_jobs.status`: `published`.
- Generated export URL: `/api/distributions/[jobId]/export`.
- Export package route: `200`.
- Export payload version: `distribution-mvp-v1`.
- Export payload included the saved asset list.
- Ownership check added before job creation.

Remaining risks:

1. External OpenAI/Gemini image calls timed out from this local machine; production server networking/provider access still needs verification before promising external AI image generation.
2. Local standalone preview must receive `.env.local` values through process environment; `.next/standalone` does not automatically include `.env.local`.
3. E2E test data remains in Supabase for auditability and was not deleted.
4. Local video provider is a Beta preview fallback, not a true rendered MP4/video model. Real video production still requires configured Kling or Runway credentials and provider smoke tests.
5. Short Drama local fallback creates SVG preview assets for video scenes. This is enough for Beta demo value, but production video quality depends on a real video provider.
6. Provider readiness dry-run does not prove external provider account quota or generation quality; each real provider still needs one controlled paid smoke test before public Beta promises.
7. Distribution MVP prepares export packages for manual publishing; real TikTok, YouTube Shorts, and Xiaohongshu publishing still requires platform OAuth, review, quota, and compliance work.
