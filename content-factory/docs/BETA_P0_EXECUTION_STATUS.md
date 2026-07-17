# Beta P0 Execution Status

Last updated: 2026-07-17

Current gate: **Closed Beta = NOT READY**

Scope: execution status only. No business code, AI Runtime, Workflow Engine, Billing Core, Credits Core, or database schema changes were made.

Source note: `docs/BETA_P0_EXECUTION_CHECKLIST.md` was requested as input but is not present in the repository at this execution time. This status file is based on `docs/PROJECT_STATUS.md`, `ACTIVE_WORK.md`, `CHANGELOG.md`, production readiness docs, environment template review, and the user-provided P0 gate requirements.

## P0 summary

| Area | Status | Blocking reason |
| --- | --- | --- |
| Auth/Beta Access | VERIFIED | Linked Supabase + local production preview verification passed. Production-domain smoke test is still required separately. |
| Backup/PITR Restore | BLOCKED | Supabase CLI reports `pitr_enabled=false` and `backups=null`; restore evidence is missing. |
| Closed Beta Gate | BLOCKED | Backup/PITR and production smoke test evidence are incomplete. |

Backup/PITR closure runbook: `docs/SUPABASE_BACKUP_CLOSURE_RUNBOOK.md`.

## Auth/Beta Access

Status: **VERIFIED for linked Supabase + local production preview**

### Owner

- Required owner: Founder / production operator with access to production domain, Supabase Auth, `ADMIN_EMAILS`, and Beta invite creation.
- Current execution owner in this repository pass: Codex documentation/operator-prep only.

### Current configuration

Observed from `.env.production.example` and current code references:

- `BETA_INVITE_ONLY=true` is present in the production environment template.
- `ADMIN_EMAILS=founder@your-domain.com` placeholder is present in the production environment template.
- `/api/auth/bootstrap` reads `ADMIN_EMAILS`.
- `/api/auth/bootstrap` defaults invite-only behavior to enabled unless `BETA_INVITE_ONLY=false`.
- `/api/auth/bootstrap` requires an invite code for non-admin signup when invite-only mode is active.
- `/beta` page exists as the visible Beta invite entry.
- `/api/beta/invites/verify` exists for invite verification.

Current gap:

- Production real values are not verified in this workspace.
- Production domain auth redirect URLs are not verified.
- Production admin account is not verified.
- Production invite creation and consumption have not been evidenced.
- A `docs/BETA_P0_EXECUTION_CHECKLIST.md` source checklist was requested but does not exist in the repository.

### Required execution actions

1. Configure production `ADMIN_EMAILS` with the actual Founder/admin email.
2. Confirm `BETA_INVITE_ONLY=true` in the production runtime environment.
3. Confirm Supabase Auth redirect URLs include the production domain and Beta entry path.
4. Login as admin on production.
5. Create a Beta invite from the production Admin Beta flow.
6. Open the invite link as a non-admin test user.
7. Complete signup/login.
8. Run `/api/auth/bootstrap`.
9. Confirm:
   - profile is created
   - workspace is created
   - invite is consumed
   - non-invited user cannot bypass the Beta gate

### Acceptance evidence

Detailed evidence is recorded in `docs/AUTH_BETA_ACCESS_VERIFICATION.md`.

Verified:

- Controlled test user created.
- Login succeeded.
- Invite was verified and consumed.
- `/api/auth/bootstrap` created the customer profile.
- Workspace was created and listed.
- `/dashboard` returned `200`.
- Customer access to `/api/admin/users` returned `403`.
- Uninvited user bootstrap returned `401`.

Production-domain follow-up:

- Run the same smoke on the production HTTPS domain after VPS/Nginx/SSL are online.

## Backup/PITR Restore

Status: **BLOCKED**

### Backup owner

- Required owner: Founder / production operator with Supabase project owner access.
- Restore verifier: production operator who can safely run restore validation in a non-destructive environment or Supabase-managed restore workflow.
- Current execution owner in this repository pass: Codex documentation/operator-prep only.

### Current status

Known from prior production verification records:

- Production migrations were verified through `0032_founder_revenue_validation.sql`.
- Required production tables were previously reachable through Supabase service role checks.
- `supabase backups list --project-ref rfghzowaeqojvnxiqznc -o json` returned `pitr_enabled=false` and `backups=null`.
- A pre-Beta backup was not created from this workstation.
- Docker is not installed on this workstation.
- `pg_dump` is unavailable on this workstation.
- `DATABASE_URL` is not configured on this workstation.
- `docs/BACKUP.md` and `docs/RESTORE.md` define backup and restore procedures.

Current gap:

- No backup artifact/timestamp is recorded for the production Beta launch gate.
- No PITR status evidence is recorded.
- No restore verification evidence is recorded.
- Storage backup status is not verified for production asset durability.
- Backup closure checklist is prepared in `docs/SUPABASE_BACKUP_CLOSURE_RUNBOOK.md`, but it has not been executed.

### Restore plan

Preferred production-safe sequence:

1. Confirm Supabase project ref for production.
2. Create a pre-Beta database backup from Supabase Dashboard or a secure machine with Docker/`pg_dump`/`DATABASE_URL`.
3. Record backup timestamp, method, project ref, release commit, and storage location.
4. Confirm whether Supabase PITR is enabled for the production project and record the retention window.
5. Verify restore procedure without overwriting production data:
   - use Supabase-managed restore preview if available, or
   - restore the dump into a separate validation database/project, or
   - document Supabase Dashboard restore path and run a controlled non-production restore drill.
6. Validate restored data includes:
   - Auth users metadata required for login
   - public schema tables
   - migrations through `0032`
   - `founder_customer_projects`
   - Beta tables
   - Credits and usage tables
   - task and asset metadata
7. If Supabase Storage is used for production assets, export/verify bucket backup and object count.

### Acceptance evidence required

- Backup method used.
- Backup timestamp.
- Supabase project ref.
- Backup location with secrets redacted.
- PITR enabled/disabled status and retention window.
- Restore validation target.
- Restore validation result.
- Post-restore checks:
  - `/api/health`
  - `/admin/checklist`
  - user login/bootstrap
  - Credits consistency
  - task/assets metadata availability
- Storage backup evidence if storage is used.

## Closed Beta Gate

- [x] Auth Ready
- [ ] Backup Ready
- [ ] Restore Verified
- [ ] Production Smoke Test Passed
- [x] Beta User Created

Gate decision: **Do not invite Closed Beta users yet.**

Do not update Backup/PITR to READY until the Supabase Dashboard backup checklist and restore drill checklist in `docs/SUPABASE_BACKUP_CLOSURE_RUNBOOK.md` are completed with real evidence.

## Next execution order

1. Assign Backup/PITR owner.
2. Execute `docs/SUPABASE_BACKUP_CLOSURE_RUNBOOK.md`.
3. Create or confirm a pre-Beta Supabase backup.
4. Verify PITR or complete a non-production restore drill.
5. Run `docs/PRODUCTION_SMOKE_TEST_CHECKLIST.md` on the production domain.
6. Invite controlled Beta users only after all Closed Beta gates pass.
