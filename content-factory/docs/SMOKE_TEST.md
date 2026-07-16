# Automation Factory Smoke Test

Use this checklist after production deployment and before inviting real users.

## User smoke test

### 1. Registration

- [ ] Open the production domain.
- [ ] Register a new user.
- [ ] Confirm email flow if email verification is enabled.
- [ ] Confirm the user can reach the dashboard.

### 2. Login

- [ ] Logout.
- [ ] Login again with the same user.
- [ ] Confirm protected dashboard pages load.

### 3. Dashboard

- [ ] Open `/dashboard/templates`.
- [ ] Open `/dashboard/content`.
- [ ] Open `/dashboard/workspaces`.
- [ ] Confirm no page shows an authorization or loading error.

### 4. Create task

- [ ] Select a prompt/template.
- [ ] Create a content task.
- [ ] Confirm the task appears in the dashboard.
- [ ] Confirm the task reaches completed or failed with a clear error.

### 5. Image generation

- [ ] Open `/dashboard/images`.
- [ ] Create an image task.
- [ ] Confirm status updates.
- [ ] If real provider is configured, confirm image result is visible.
- [ ] If mock/local provider is used, confirm graceful placeholder behavior.

### 6. Video generation

- [ ] Open `/dashboard/videos`.
- [ ] Create a video task.
- [ ] Confirm task status updates.
- [ ] If real provider is configured, confirm video link/player works.
- [ ] If mock/local provider is used, confirm graceful placeholder behavior.

### 7. Credits consumption

- [ ] Record user credits balance before task creation.
- [ ] Create a paid task.
- [ ] Confirm credits are reserved/charged/refunded according to task result.
- [ ] Confirm credit transaction appears in billing/credits history.

### 8. Billing page

- [ ] Open `/dashboard/billing`.
- [ ] Confirm current plan renders.
- [ ] Confirm credits balance renders.
- [ ] Confirm usage/transaction history renders.
- [ ] Confirm upgrade path is visible.

## Admin smoke test

### 1. Admin login

- [ ] Set `ADMIN_EMAILS` to the admin email.
- [ ] Login with that email.
- [ ] Open `/admin`.
- [ ] Confirm admin APIs do not return 403.

### 2. Users

- [ ] Open `/admin/users`.
- [ ] Confirm user list renders.
- [ ] Confirm credits balance is visible.
- [ ] If needed, test a small manual credit adjustment on a test user.

### 3. Tasks

- [ ] Open `/admin/tasks`.
- [ ] Confirm running/failed tasks render.
- [ ] If a failed test task exists, retry it.

### 4. Health

- [ ] Open `/admin/health`.
- [ ] Confirm AI calls, success rate, failure rate, credits, providers, and errors render.

### 5. System

- [ ] Open `/admin/system`.
- [ ] Confirm Database is READY.
- [ ] Confirm Environment is READY.
- [ ] Review WARNING items for optional systems.
- [ ] Confirm there are no unexpected ERROR items.

### 6. Checklist

- [ ] Open `/admin/checklist`.
- [ ] Confirm migration check references `0028_beta_validation_readiness.sql`.
- [ ] Confirm Security is READY.
- [ ] Confirm Backup is READY or explicitly accepted as WARNING.

### 7. Monitor

- [ ] Open `/admin/monitor`.
- [ ] Confirm task success/failure metrics render.
- [ ] Confirm queue status renders.
- [ ] Confirm provider error list renders or shows empty state.

## Pass criteria

Production can accept beta users when:

- [ ] User login works.
- [ ] Dashboard loads.
- [ ] At least one content task can be created.
- [ ] Credits balance changes are explainable.
- [ ] Admin can access Users, Tasks, Health, System, Checklist, and Monitor.
- [ ] `/api/health` returns healthy status.
- [ ] No unexpected ERROR remains in `/admin/checklist`.
