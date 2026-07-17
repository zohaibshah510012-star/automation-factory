# Backup / PITR Verification

Last updated: 2026-07-17

Status: **BLOCKED**

Closed Beta impact: Backup/PITR Restore P0 is not ready. Do not invite Closed Beta users until a pre-Beta backup exists and a restore/PITR path is verified.

Scope: preparation and capability check only. No database schema change, destructive restore, production data deletion, or migration push was performed.

## Current Supabase project

| Item | Result |
| --- | --- |
| Linked project ref | `rfghzowaeqojvnxiqznc` |
| Project name | `zohaibshah510012-star's Project` |
| Region | `us-east-1` |
| Status | `ACTIVE_HEALTHY` |
| Postgres | `17.6.1.141` |
| Remote migrations | `0001` through `0032` listed |

## Backup capability check

Command:

```bash
SUPABASE_NO_TELEMETRY=1 supabase backups list --project-ref rfghzowaeqojvnxiqznc -o json
```

Sanitized result:

```json
{
  "backups": null,
  "physical_backup_data": {},
  "pitr_enabled": false,
  "region": "us-east-1",
  "walg_enabled": true
}
```

Interpretation:

- No available physical backup was listed by the CLI.
- PITR is currently disabled.
- WAL-G support is present, but that does not by itself satisfy the restore gate.
- Backup/PITR is therefore **not ready** for Closed Beta.

## Local backup tooling check

| Tool / setting | Result | Impact |
| --- | --- | --- |
| Supabase CLI | `2.109.1` available | Can inspect projects/backups and run migration list. |
| Docker | missing | Blocks `supabase db dump` workflows that require Docker on this workstation. |
| `pg_dump` | missing | Blocks direct Postgres dump from this workstation. |
| `.env.local` `DATABASE_URL` | missing | Blocks direct `pg_dump` / `pg_restore` validation from this workstation. |
| `.env.local` `SUPABASE_ACCESS_TOKEN` | missing | Not required because CLI profile is already logged in, but should not be committed if used. |

Additional CLI note:

- `supabase db dump --help` triggered a Supabase CLI telemetry file rename `EPERM` on this Windows workstation.
- Re-running backup-related commands with `SUPABASE_NO_TELEMETRY=1` avoided the telemetry write issue for `supabase backups list`.

## PITR status

PITR status from Supabase CLI: **disabled**

Evidence:

- `pitr_enabled=false`
- `backups=null`

Required before Beta:

1. Decide whether the production Supabase plan should enable PITR.
2. If PITR is enabled, record retention window and test restore command format.
3. If PITR is not enabled, create and verify a manual pre-Beta backup before any user data enters the system.

## Restore steps

Preferred managed Supabase path:

1. Confirm production project ref: `rfghzowaeqojvnxiqznc`.
2. Create a pre-Beta backup in Supabase Dashboard.
3. Record:
   - backup timestamp
   - project ref
   - release commit
   - backup method
   - owner
   - restore target
4. Verify a restore path without overwriting production:
   - restore into a separate validation project if possible, or
   - use Supabase-managed restore preview/workflow if available, or
   - run a documented non-production restore drill.
5. Run post-restore checks:
   - migrations through `0032`
   - `profiles`
   - `workspaces`
   - `beta_invites`
   - `founder_customer_projects`
   - `content_tasks`
   - `assets`
   - `credit_transactions`
   - `usage_history`
   - `/api/health`
   - `/admin/checklist`

Direct dump path when `DATABASE_URL` and `pg_dump` are available:

```bash
mkdir -p backups
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file "backups/automation-factory-$(date +%Y%m%d-%H%M%S).dump"
```

Direct restore validation path:

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$VALIDATION_DATABASE_URL" backups/<backup-file>.dump
```

PITR restore command shape if PITR is enabled:

```bash
supabase backups restore --project-ref rfghzowaeqojvnxiqznc --timestamp <unix-epoch-seconds>
```

Do not run PITR restore against production as a test. Use a controlled restore workflow or validation target.

## Verification method

Backup is ready only when all evidence exists:

- [ ] Backup artifact or Supabase Dashboard backup is visible.
- [ ] Backup timestamp is recorded.
- [ ] Backup owner is recorded.
- [ ] Restore method is documented.
- [ ] Restore target is non-production or explicitly approved.
- [ ] Restored database can run `/api/health`.
- [ ] Restored database has migrations through `0032`.
- [ ] Restored database has Auth/profile/workspace/credits/tasks/assets data.
- [ ] Storage backup is verified if production assets depend on Supabase Storage.

## Risks

- PITR is currently disabled, so point-in-time recovery cannot be counted as a Closed Beta safety net.
- No physical backups were listed by the Supabase CLI.
- This workstation cannot create a dump because Docker, `pg_dump`, and `DATABASE_URL` are unavailable.
- Local generated assets are not equivalent to durable cloud object storage unless storage backup is configured.
- Running restore directly against production would risk data loss and is not acceptable as a verification method.

## Gate decision

Backup/PITR Restore remains **BLOCKED**.
