# Automation Factory Project Status

Last updated: 2026-07-17

## Current phase

Founder Beta Cohort Data Cleanup - isolate real Founder Beta Cohort 1 metrics from historical smoke/dev data, bind real Beta users explicitly, and ensure new generation tasks record usable duration data.

The current product direction is to make Automation Factory usable as a first-session AI SaaS: a new invited user should be able to sign in, land on Dashboard, choose a workflow template, create a task, view the Task Result page, and submit feedback without engineering support.

## Latest verified commit before this report

`2033e7094494d0f29ccbf3137760b20067e22af4`

## Founder Beta Cohort Data Cleanup status

This sprint fixes the highest current Beta operating risk: historical smoke/dev rows were mixed into Founder View metrics, which made activation, completion, workflow usage, latency, Credits, and feedback signals unsafe for product decisions.

What changed:

- Added migration `0031_founder_beta_data_cleanup.sql`.
- Remote Supabase migrations now run from `0001` through `0031`.
- `content_tasks` now has additive `started_at` and `completed_at` fields for new generation observability.
- New text/content, image, and video tasks now write `duration_ms` into `content_tasks`.
- New usage records now write `usage_history.duration_ms` from the completed task timing.
- `/api/admin/founder` now defaults to `active_cohort_members` scope instead of mixing all invite/profile/smoke data.
- `/api/admin/founder` now exposes candidate users and supports binding a real Beta user into `beta_cohort_members` by email.
- `/admin/founder` now shows a cohort-only warning when no real users are bound.
- `/admin/founder` now includes a small binding panel for Founder Beta users and an Active Cohort Members list.
- Founder review notes and feedback signals are now scoped to the active cohort or bound users.

Current Founder Beta Cohort 1 data:

- Cohort: `Founder Beta Cohort 1`
- Target users: `5`
- Status: `running`
- Members: `0`
- Binding result: no users were auto-bound because the repository/database does not contain an authoritative list of the first 5 real external Beta users.

Decision posture:

- Historical data was preserved.
- Existing Admin Analytics and broader Beta Insights remain available.
- Founder View is now intentionally stricter: until the 5 real users are bound, cohort-only metrics should show an empty or near-empty experiment instead of polluted historical activity.

Validation:

- `supabase db push`: applied `0031_founder_beta_data_cleanup.sql`.
- `supabase migration list`: confirmed `0001` through `0031` local and remote.
- Remote check confirmed `content_tasks.started_at`, `content_tasks.completed_at`, and `content_tasks.duration_ms` are readable.
- `pnpm lint`: passed.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm build`: passed.

Next operating step:

Bind the first 5 real Beta users in `/admin/founder`, then run a clean 48-72 hour Founder Beta cycle before choosing the next product direction.

## Founder Beta Execution status

Current execution posture:

- No new AI models, providers, workflows, publishing integrations, Billing Core changes, Credits core changes, or Workflow Engine changes were added.
- The first-user path remains: Invite -> Signup -> Workspace -> Create -> Short Drama -> Result -> Feedback.
- `/admin/founder` now functions as the daily Founder operating page.

Daily monitoring now covers:

- User funnel: invited, signed up, workspace created, activated, generated, completed.
- System health: failed tasks, provider/system errors, average generation latency, P95 generation latency, and Credits consumption.
- Feedback: Bug, Feature Request, Quality Issue, User Feedback, Need, and Payment Signal.

Latest remote Beta data snapshot:

- Founder cohort: `Founder Beta Cohort 1`, target users `5`, status `running`.
- Invites: `16 used`, `2 pending`.
- Product events are present for `signup_completed`, `first_workspace_created`, `first_generation_started`, `first_generation_completed`, and `feedback_submitted`.
- Tasks: `66 completed`, `11 failed`.
- Feedback rows: `5`.
- Low-quality feedback rows: `0`.
- Recent error logs: `15`.
- Credits consumed: `4445`.

Observed failed tasks are historical Beta/dev smoke data, mainly OpenAI image timeouts, insufficient Credits, and older provider-configuration failures. These are now visible in `/admin/founder` and do not introduce a new P0/P1 code blocker for the current local fallback Beta path.

## Founder Beta Operation Cycle snapshot

This operation cycle is monitoring-only. No new product capability, provider, workflow, AI runtime change, Billing Core change, Credits core change, or architecture refactor was introduced.

Current remote Beta cohort:

- Cohort: `Founder Beta Cohort 1`
- Target users: `5`
- Status: `running`
- Cohort member rows: `0`
- Current invite rows: `18`
- Invite status: `16 used`, `2 pending`

Current funnel snapshot from invited profiles and product events:

- Signup users: `16`
- Workspace users: `4`
- First generation started users: `14`
- First generation completed users: `11`
- Feedback users: `3`
- Activation Rate: `61.1%`
- First Generation Rate: `68.8%`
- Task Completion Rate: `95%`
- Feedback Rate after first generation: `27.3%`
- Average Time To First Value: `0.5 minutes`

Current workflow usage among invited-profile tasks:

- `image`: `19`
- `video`: `15`
- `short_video_script`: `3`
- `drama`: `3`

Current system stability snapshot:

- Invited-profile tasks: `40`
- Completed tasks: `38`
- Failed tasks: `2`
- Provider/system error logs visible in monitoring: `15`
- Credits consumed by invited-profile usage: `2615`
- Average recorded generation latency: `0ms` because many historical tasks do not have `duration_ms` populated.
- P95 recorded generation latency: `0ms` for the same reason.

Current feedback snapshot:

- Feedback rows: `5`
- Average satisfaction: `5/5`
- Average result quality: `4/5`
- Quality issue rows: `0`
- Payment signals: `1`
- Captured use case: Beta dry run short drama ad workflow.

Current blocker assessment:

- P0: none found in the current monitoring snapshot.
- P1: `2` historical failed invited-profile tasks are still visible; continue monitoring in `/admin/founder`.
- Data caveat: remote data still includes historical smoke/dev test users. `/admin/founder` intentionally uses a broader Beta-candidate scope for operations, while this snapshot focuses on invited-profile activity. Neither view should be treated as clean external-user evidence until the first 5 manually selected users are tracked as cohort members.

Decision posture:

- Do not add new features yet.
- Continue the current 5-user Beta operation cycle.
- The next product decision should wait for clean cohort data from the manually selected users.

## Founder Beta Run status

This sprint adds the operating layer needed for the founder-led 5-user Beta run without adding new AI capabilities, providers, billing logic, or workflow engine changes.

New Founder Beta Run capabilities:

- `/admin/founder` is the Founder View for the first real-user cohort.
- `/api/admin/founder` aggregates invited, registered, activated, completed, first-generation rate, completion rate, average Time To First Value, most-used workflow, Credits used, estimated cost, feedback score, result quality, and upgrade-interest signals.
- `0030_founder_beta_run.sql` adds admin-only operating tables:
  - `beta_cohorts`
  - `beta_cohort_members`
  - `beta_review_notes`
- Founder View supports creating the default 5-user Founder Beta Cohort.
- Founder View links to `/admin/beta` for Demo Invite creation instead of hard-coding credentials or fake users.
- Beta Review Notes capture user feedback, needs, bugs, feature requests, and business signals with status tracking (`open`, `reviewing`, `resolved`).
- Remote Supabase now has `0030_founder_beta_run.sql` applied.
- Default remote cohort created: `Founder Beta Cohort 1`, target users `5`, status `running`.

Beta Launch checklist status:

- Invite flow: covered by `/admin/beta` and `/api/beta/invites/verify`.
- Signup / workspace / first-generation / result / feedback chain: covered by existing product events and Beta validation readiness.
- Admin founder monitoring: covered by `/admin/founder`.
- Daily diagnostic signals: failed generations, recent error logs, blocking points, and feedback classification are visible on `/admin/founder`.
- System diagnostic signals now include generation latency, P95 latency, provider errors, and Credits consumption.

Founder Beta user test path:

1. Admin creates or reuses the Founder Beta Cohort.
2. Admin creates up to 5 invites from `/admin/beta`.
3. User opens invite link and signs up.
4. User reaches Dashboard and creates the recommended `short_drama` workflow.
5. User reviews Task Result and Assets.
6. User submits feedback.
7. Founder records decision-quality notes in `/admin/founder`.
8. Founder reviews the daily monitor section for failed generations, recent errors, blocking points, and feedback themes.

The core validation question for this stage is commercial: can 3-5 invited users understand the product, reach a first result, and produce actionable feedback without engineering hand-holding?

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

Local migrations currently run from `0001` through `0030`.

Remote Supabase was found at `0026` during E2E. `0027_beta_experiment_tracking.sql` was applied with `supabase db push`.

Remote now reports:

- `0001` through `0029`: applied
- `0030_founder_beta_run.sql`: applied locally and remotely for Founder Beta Run operations.

This fixed missing `feedback_submitted` product analytics events. Before `0027` was applied, feedback rows were saved but the analytics event was rejected by the older `product_events_event_name_check` constraint.

Latest migration sync:

- `0028_beta_validation_readiness.sql` adds Beta Validation events (`workflow_created`, `first_workflow_created`, `generation_failed`) and richer feedback fields (`result_quality`, `use_case`, `continue_use`).
- `0028_beta_validation_readiness.sql` has been pushed to the target Supabase project and confirmed with `supabase migration list`.
- `0029_beta_operations.sql` adds `beta_user_statuses` for manual Beta cohort status tracking (`invited`, `active`, `completed`, `churned`) with admin-only RLS.
- `0029_beta_operations.sql` has been pushed to the target Supabase project and confirmed with `supabase migration list`.
- `0030_founder_beta_run.sql` adds Founder Beta Run cohort tracking and review notes with admin-only RLS.
- `0030_founder_beta_run.sql` has been pushed to the target Supabase project and confirmed with `supabase migration list`.

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

Beta Launch Preparation status:

- Local fallback cost attribution is now corrected for text, image, and video workflows.
- Text fallback usage now records `local-text-provider / local-content-pack` instead of inheriting the Agent pricing row.
- Image fallback usage now records `local-image-provider / local-svg-image`.
- Video fallback usage now records `local-video-provider / local-svg-video-preview`.
- `ai_provider_costs` and Admin cost overview now include the local fallback providers as first-class cost groups.
- Demo Templates are ready for the Beta Launch Pack:
  - AI Short Drama: `short_drama`
  - Product Advertisement: `tiktok_ad` and `product_promo_video`
  - Social Media Content: `xiaohongshu_content` and `youtube_shorts`
- Demo data readiness is covered by Showcase, Studio demo preview, Workflow Templates, local generated image SVGs, local video preview SVGs, and Short Drama sample outputs from the Dry Run.
- Feedback Loop remains active from user feedback submission into `user_feedback`, product events, Admin Feedback, Admin Analytics, and Beta Insights.
- Production Safety check previously found migrations `0001` through `0029` applied on the linked Supabase project, server-only service role usage, no committed `.env.local`, no `NEXT_PUBLIC` service-role key usage, existing rate limits on Beta invite verification and analytics events, and daily generation limits on generation APIs.
- Founder Beta Run migration `0030_founder_beta_run.sql` is now applied on the linked Supabase project.

Latest Beta Launch Preparation smoke:

- Local production preview: `http://127.0.0.1:3001`
- `/api/health`: `200`, database `true`
- Text task: `4425d7f2-7bc6-4969-85ea-3c9505592765`, `completed`, `usage_history.provider/model = local-text-provider / local-content-pack`, estimated cost `0.25`
- Image task: `d50490a7-247e-4005-a558-088e111e3a6e`, `completed`, `usage_history.provider/model = local-image-provider / local-svg-image`, estimated cost `0.40`
- Video task: `da082342-bf53-4364-830c-da88ad513367`, `completed`, `usage_history.provider/model = local-video-provider / local-svg-video-preview`, estimated cost `1.00`

Beta Operations readiness status:

- `/admin/beta-insights` now functions as the Beta Users operating page.
- Admin can view each Beta user's operational status, registration time, first generation time, recent activity, workflows used, Credits consumed, feedback count, upgrade intent, plan, lifecycle, and Beta Health Score.
- Admin can manually mark Beta users as `invited`, `active`, `completed`, or `churned`; updates are written to `beta_user_statuses` and audited in `audit_logs`.
- Activation metrics now include signup completed, workspace created, first generation started, first generation completed, feedback submitted, and average Time To First Value.
- Feedback Intelligence now groups feedback into content quality, generation speed, usability, use case, and payment-intent signals, with average score, result quality, recommendation rate, open feedback count, and common issue labels.
- Production diagnostics and checklists now expect `0030_founder_beta_run.sql`.
- Generated asset route no longer emits the previous Turbopack NFT tracing warning during `pnpm build`.

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
- `/admin/founder` now includes Beta launch checklist, blocking points, failed generations, recent error logs, feedback categories, pain points, feature requests, and payment signals.
- Product feedback is now grouped into User Feedback, Bug, Feature Request, Need, and Business Signal inside the Founder review flow.
- `/admin/founder` now also surfaces Quality Issues, provider error count, generation latency, P95 latency, and Credits consumption for the daily Founder review.

Beta Validation readiness status:

- Invite -> register -> bootstrap -> workspace -> create workflow -> generate -> result -> feedback is supported by existing product paths.
- Product events now track workflow creation, first workflow creation, generation starts, generation success, generation failure, Credits consumed, and feedback submitted.
- Success/failure events include workflow type, task id, duration, provider, Credits where available, and error reason on failure.
- Feedback now captures satisfaction, result quality, use case, continue-use intent, task linkage, content feedback, and suggestions.
- `/admin/analytics` now shows Beta user count, active/activated signals, workflow usage, success rate, average generation cost, Credits consumed, and feedback distribution.
- Demo readiness uses existing Workflow Templates, Showcase, Studio demo preview, local Image Provider fallback, and local Video preview fallback. A demo account should be created with `/admin/beta` rather than hard-coded credentials.
- The launch checklist can now be checked from `/admin/founder` without leaving the operating dashboard.

Latest Beta Dry Run result:

- Target Supabase migrations: `0001` through `0028` applied.
- Demo invite user created, logged in, bootstrapped, and invite consumed.
- Ordinary Beta user created, logged in, bootstrapped, workspace created, and invite consumed.
- Short Drama workflow created from API and reached `completed`.
- Main task id: `ea71ec35-33c2-47ca-80bb-5f0e51d05ec7`.
- Short Drama asset status: `completed`.
- Assets saved on the main task: 4 image assets and 5 video preview assets.
- Credits: `1000 -> 320` after the full Short Drama package including child image/video preview tasks.
- Feedback submitted with satisfaction `5/5`, result quality `4/5`, use case, task linkage, and continue-use intent.
- Product events confirmed: `signup_completed`, `first_workspace_created`, `workflow_created`, `first_workflow_created`, `first_generation_started`, `task_complete`, `first_generation_completed`, `credits_consumed`, and `feedback_submitted`.
- Pages verified with `200`: `/dashboard`, `/create`, `/tasks/[id]`, `/dashboard/studio/[id]`, `/assets`, `/dashboard/feedback`.
- Admin APIs verified with `200`: `/api/admin/users`, `/api/admin/tasks`, `/api/admin/analytics`, `/api/admin/feedback`.
- Admin Analytics showed workflow counts, success rate, average generation cost, Credits consumed, and feedback distribution.

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
8. Real Beta user evidence is still pending. The next product risk is not engineering capability but whether 3-5 invited users can complete a first generation and provide actionable feedback without hand-holding.
