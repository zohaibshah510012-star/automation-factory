# Supabase Backup Closure Runbook

Last updated: 2026-07-17

Purpose: close the Backup/PITR P0 gate before inviting Closed Beta users.

Current gate: **Backup/PITR = BLOCKED**

Scope: operational closure only. Do not modify business code, AI Runtime, Workflow Engine, Billing Core, Credits Core, or database schema while executing this runbook.

## 0. Current known state

| Item | Current result |
| --- | --- |
| Production Supabase project ref | `rfghzowaeqojvnxiqznc` |
| Project name | `zohaibshah510012-star's Project` |
| Region | `us-east-1` |
| Migration baseline | `0001` through `0032` |
| Backup status from CLI | `backups=null` |
| PITR status from CLI | `pitr_enabled=false` |
| Local dump capability | blocked: Docker missing, `pg_dump` missing, `DATABASE_URL` missing |

Do not mark Backup/PITR as READY until the operator fills the evidence sections below.

## 1. Supabase Dashboard Backup Checklist

Complete this section from the Supabase Dashboard or another approved production backup system.

| Field | Required value / evidence | Status |
| --- | --- | --- |
| Operator | Name/email of the person executing backup | [ ] |
| Execution time | ISO timestamp with timezone | [ ] |
| Supabase organization | Organization name or slug | [ ] |
| Project name | `zohaibshah510012-star's Project` or corrected production project name | [ ] |
| Project ref | `rfghzowaeqojvnxiqznc` | [ ] |
| Backup type | Dashboard backup, scheduled backup, PITR, or manual dump | [ ] |
| Backup status | Available / completed / failed | [ ] |
| Backup created at | Timestamp shown by Supabase | [ ] |
| PITR status | Enabled or disabled | [ ] |
| PITR retention window | Required if enabled | [ ] |
| Backup location | Dashboard reference or secure storage location; no secrets in repo | [ ] |
| Release commit | Commit intended for Closed Beta release | [ ] |
| Storage backup status | Required if Supabase Storage is used for production assets | [ ] |

### Dashboard steps

1. Open Supabase Dashboard.
2. Select production project ref `rfghzowaeqojvnxiqznc`.
3. Go to Database backup / Backups.
4. Confirm whether backups are available.
5. Confirm whether PITR is enabled.
6. If no usable backup exists, create/export a pre-Beta backup before accepting users.
7. Record backup timestamp and owner.
8. Do not paste connection strings, service-role keys, access tokens, or dump URLs into this repository.

### CLI evidence command

Use this after Dashboard confirmation to capture non-secret status:

```bash
SUPABASE_NO_TELEMETRY=1 supabase backups list --project-ref rfghzowaeqojvnxiqznc -o json
```

Ready evidence must show at least one of:

- a valid backup entry in `backups`, or
- `pitr_enabled=true` with a documented retention window, or
- a manually created dump artifact plus restore-drill evidence.

## 2. Restore Drill Checklist

Restore verification must not overwrite production.

### Restore drill strategy

Choose one:

- [ ] Restore into a separate Supabase validation project.
- [ ] Restore into a separate PostgreSQL validation database.
- [ ] Use a Supabase-managed restore preview workflow if available.
- [ ] Document a provider-confirmed restore path and complete a non-production drill.

### Restore steps

1. Create isolated environment.
   - [ ] New Supabase validation project or isolated PostgreSQL database exists.
   - [ ] Environment is clearly marked non-production.
   - [ ] No production app traffic points to this environment.

2. Restore database.
   - [ ] Restore from Dashboard backup, PITR timestamp, or manual dump.
   - [ ] Restore command or Dashboard action is recorded.
   - [ ] Restore completed without destructive production action.

3. Verify migration baseline.
   - [ ] `supabase migration list` or SQL equivalent shows `0001` through `0032`.
   - [ ] `0032_founder_revenue_validation.sql` is applied.

4. Verify core tables.

| Table / domain | Required verification | Status |
| --- | --- | --- |
| `profiles` | table exists and representative rows can be read | [ ] |
| `workspaces` | table exists and workspace ownership data can be read | [ ] |
| `content_tasks` | table exists and task rows can be read | [ ] |
| `assets` | table exists and asset metadata can be read | [ ] |
| credits | `credit_transactions` exists and credit rows can be read | [ ] |
| `usage_history` | table exists and usage rows can be read | [ ] |
| `founder_customer_projects` | table exists and project rows can be read | [ ] |

5. Verify app health against restored environment.
   - [ ] `/api/health` returns healthy database status.
   - [ ] `/admin/checklist` has no unexpected migration/database ERROR.
   - [ ] Auth/bootstrap path is explainable in the restored environment.
   - [ ] Credits records are internally consistent.
   - [ ] Task and asset metadata are readable.

6. Record drill outcome.
   - [ ] Restore drill owner recorded.
   - [ ] Restore drill timestamp recorded.
   - [ ] Backup source recorded.
   - [ ] Restore target recorded.
   - [ ] Pass/fail result recorded.
   - [ ] Any data-loss window or limitation recorded.

## 3. Beta Release Gate

Closed Beta can proceed only when the following are checked:

- [x] Auth Ready
- [ ] Backup Ready
- [ ] Restore Verified
- [ ] Production Smoke Test Passed
- [x] Beta User Created

### Gate closure rule

Only after Backup Ready and Restore Verified are backed by real evidence:

1. Update `docs/BETA_P0_EXECUTION_STATUS.md`:
   - `Backup/PITR Restore = READY`
   - Closed Beta Gate:
     - `[x] Auth Ready`
     - `[x] Backup Ready`
     - `[x] Restore Verified`
     - keep `Production Smoke Test Passed` unchecked until production domain smoke passes
2. Update `docs/PROJECT_STATUS.md`.
3. Update `CHANGELOG.md`.
4. Commit the evidence/status update.

Do not mark Closed Beta fully ready until `Production Smoke Test Passed` is also checked.

## 4. Current decision

As of 2026-07-17, this runbook is prepared, but Backup/PITR remains **BLOCKED** because no backup artifact, PITR enablement, or restore-drill evidence has been recorded.
