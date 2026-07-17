# Production Smoke Test Checklist

Last updated: 2026-07-17

Purpose: concise pass/fail checklist for the final production smoke test before inviting controlled Beta customers.

Scope: production environment only. Use a real admin account and a disposable invited customer account. Do not use fake provider keys or commit secrets.

## Pre-check

- [ ] Production domain is known: `https://<domain>`.
- [ ] Deployed commit is recorded.
- [ ] Supabase project ref is confirmed.
- [ ] Pre-Beta Supabase backup exists.
- [ ] Remote migrations are applied through `0032_founder_revenue_validation.sql`.
- [ ] PM2 or Docker process is online.
- [ ] Nginx + SSL are online.

## Public website

- [ ] `/` loads with HTTP `200`.
- [ ] Header/navigation render correctly.
- [ ] Primary CTA is visible.
- [ ] Mobile viewport does not break the landing page.
- [ ] SEO metadata is present in page source or browser devtools.

## Login / auth entry

- [ ] `/login` is checked.
- [ ] If `/login` is intentionally not a route in the deployed product, record the actual auth entry used for Beta, for example `/beta?invite_code=<code>` or the configured Supabase Auth flow.
- [ ] Invited test customer can authenticate.
- [ ] `/api/auth/bootstrap` succeeds after login.
- [ ] Workspace/profile creation succeeds.

## Customer dashboard

- [ ] `/dashboard` loads.
- [ ] Credits balance is visible.
- [ ] Quick create entry is visible.
- [ ] Recent tasks/assets empty state or data state is understandable.
- [ ] No technical stack trace is shown to the customer.

## Create center

- [ ] `/create` loads.
- [ ] Workflow/template choices are visible.
- [ ] Example input is visible.
- [ ] Customer can submit a generation request.
- [ ] Error state is friendly if provider/credits/auth fails.

## Text generation

- [ ] Create a text/content task.
- [ ] Task row is created.
- [ ] Task status reaches `completed` or fails with a clear provider error.
- [ ] `/tasks/[id]` loads for the generated task.
- [ ] Credits are reserved and committed only for successful generation.
- [ ] Admin can see the task.

## Image generation

- [ ] Create an image task.
- [ ] If a real image provider is configured, generated image asset loads.
- [ ] If `AI_IMAGE_PROVIDER=local`, fallback image asset loads.
- [ ] If no image provider is configured, error is clear: image provider not configured.
- [ ] Asset appears in `/assets`.
- [ ] Credits behavior is correct and explainable.

## Video preview

- [ ] Create a video task.
- [ ] If a real video provider is configured, provider response and asset are recorded.
- [ ] If `AI_VIDEO_PROVIDER=local`, video preview fallback asset loads.
- [ ] If no video provider is configured, error is clear: video provider not configured.
- [ ] Asset appears in `/assets`.
- [ ] Credits behavior is correct and explainable.

## Assets

- [ ] `/assets` loads.
- [ ] Text/image/video preview assets are visible when generated.
- [ ] Asset links do not return unexpected `404` or `500`.
- [ ] Empty state is understandable if the account has no assets.

## Feedback

- [ ] `/dashboard/feedback` loads.
- [ ] Customer can submit satisfaction, quality, use case, and notes.
- [ ] Submitted feedback is saved.
- [ ] `/admin/feedback` shows the submitted feedback to admin.

## Customer Brief

- [ ] `/brief` loads.
- [ ] Customer can submit company/brand, product, target customer, marketing goal, platform selection, and material notes.
- [ ] `/admin/revenue` shows the submitted project as a Founder/customer project.

## Admin

- [ ] Admin account is included in `ADMIN_EMAILS`.
- [ ] `/admin/checklist` loads.
- [ ] `/admin/health` loads.
- [ ] `/admin/tasks` loads.
- [ ] `/admin/analytics` loads.
- [ ] `/admin/feedback` loads.
- [ ] `/admin/revenue` loads.
- [ ] `/admin/founder` loads.
- [ ] Admin pages show no unexpected permission error.

## Pass criteria

Production can invite the first controlled customers only if:

- [ ] Health check passes.
- [ ] Auth/bootstrap works.
- [ ] Dashboard and Create work.
- [ ] Text generation works.
- [ ] Image generation or explicit image-provider error works as configured.
- [ ] Video preview or explicit video-provider error works as configured.
- [ ] Assets page works.
- [ ] Feedback reaches Admin.
- [ ] Brief reaches `/admin/revenue`.
- [ ] Admin checklist has no unexpected ERROR.

## Fail criteria

Stop launch if any item occurs:

- Supabase database is not reachable.
- Migration baseline is below `0032`.
- No pre-Beta backup exists.
- Login/bootstrap fails.
- Customer cannot reach Dashboard or Create.
- Generation failure hides the real cause.
- Credits are deducted incorrectly.
- Result page or Assets page fails.
- Admin cannot inspect health, tasks, feedback, or revenue projects.
