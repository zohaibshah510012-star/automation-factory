# Automation Factory Project Status

Last updated: 2026-07-16

## Current phase

Image Provider Beta E2E Verification.

The current product direction is to make Automation Factory usable as a first-session AI SaaS: a new invited user should be able to sign in, land on Dashboard, choose a workflow template, create a task, view the Task Result page, and submit feedback without engineering support.

## Latest verified commit before this report

`a2e1fd365426404b1711a15bcf78f410ae2c2b2c`

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

Video generation remains intentionally blocked until a dedicated video provider is configured:

- `/api/videos` returns `Video provider not configured`

This is the correct safe behavior for Beta because video tasks do not silently fall back to the text provider.

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

Beta user path is ready for invited text-generation users and local image workflow users.

Latest Image E2E result:

- `/api/images`: created task successfully.
- `image_tasks.status`: `completed`.
- `content_tasks.status`: `completed`.
- Generated image URL: `/generated/[taskId]/image.svg`.
- Generated image route: `200`.
- Image asset row: created.
- Credits: committed and deducted.
- Admin task visibility: verified.

Remaining risks:

1. External OpenAI/Gemini image calls timed out from this local machine; production server networking/provider access still needs verification before promising external AI image generation.
2. Local standalone preview must receive `.env.local` values through process environment; `.next/standalone` does not automatically include `.env.local`.
3. E2E test data remains in Supabase for auditability and was not deleted.
4. Video provider remains unconfigured.
