# Production Smoke Test Plan

Last updated: 2026-07-17

Purpose: define the final smoke test sequence before inviting real customers.

Scope: production environment only. Do not use fake `.env` values, do not modify database schema, and do not run destructive cleanup during the smoke test.

## 1. Basic health

- [ ] Open `/api/health`.
- [ ] Confirm response is healthy and database is reachable.
- [ ] Check PM2 or Docker logs for startup errors.

## 2. Admin readiness

- [ ] Login with an email listed in `ADMIN_EMAILS`.
- [ ] Open `/admin/checklist`.
- [ ] Confirm migration check references `0032_founder_revenue_validation.sql`.
- [ ] Confirm required environment variables are READY.
- [ ] Accept only intentional WARNING items for optional payment/email/storage/webhook/cron.

## 3. Customer entry path

- [ ] Open `/brief`.
- [ ] Login as a test customer.
- [ ] Submit a customer Brief with brand, product, target customer, marketing goal, platforms, and material notes.
- [ ] Open `/admin/revenue` as admin.
- [ ] Confirm the submitted Brief appears as a `planned` customer project.

## 4. Dashboard and create path

- [ ] Open `/dashboard`.
- [ ] Open `/create`.
- [ ] Select a text/content workflow.
- [ ] Generate a text task.
- [ ] Confirm `/tasks/[id]` loads and shows a completed or clearly failed task.

## 5. Image workflow

- [ ] Create an image task.
- [ ] If a real image provider is configured, confirm generated image asset loads.
- [ ] If local fallback is selected, confirm the fallback image asset is created and visible.
- [ ] Confirm credits behavior is explainable.

## 6. Video fallback workflow

- [ ] Create a video task with current production provider settings.
- [ ] If `AI_VIDEO_PROVIDER=local`, confirm the video preview fallback is created and visible.
- [ ] If Kling/Runway is configured, confirm provider response and resulting asset.
- [ ] Confirm errors are clear if provider credentials are missing.

## 7. Results and assets

- [ ] Open `/tasks/[id]` for the latest text/image/video tasks.
- [ ] Open `/assets`.
- [ ] Confirm generated text/image/video preview assets are visible.
- [ ] Confirm no asset route returns unexpected 404/500.

## 8. Feedback

- [ ] Open `/dashboard/feedback`.
- [ ] Submit feedback linked to the smoke test experience.
- [ ] Open `/admin/feedback`.
- [ ] Confirm feedback is visible to admin.

## 9. Commercial validation

- [ ] Open `/admin/revenue`.
- [ ] Confirm customer Brief projects are visible.
- [ ] Confirm Founder Demo / customer project records can be reviewed.
- [ ] Confirm no admin revenue API error appears in logs.

## 10. Pass criteria

Production can invite controlled real customers when:

- [ ] `/api/health` passes.
- [ ] `/admin/checklist` has no unexpected ERROR items.
- [ ] `/brief` creates a project visible in `/admin/revenue`.
- [ ] `/dashboard`, `/create`, `/tasks/[id]`, `/assets`, and `/dashboard/feedback` load.
- [ ] Text generation works.
- [ ] Image generation or local image fallback works.
- [ ] Video generation or local video fallback works.
- [ ] Credits behavior is explainable.
- [ ] Admin can see tasks, feedback, revenue projects, and system status.

## 11. Fail criteria

Do not invite real customers if any of these fail:

- Supabase connection or migration check fails.
- Login/bootstrap fails.
- `/brief` cannot create a customer project.
- Text generation cannot complete or fail with a clear error.
- Result page or asset page cannot load.
- Credits are deducted incorrectly or cannot be explained.
- Admin cannot access `/admin/checklist` or `/admin/revenue`.
