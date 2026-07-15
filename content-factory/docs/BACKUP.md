# Backup Procedure

## Database backup

Preferred for managed Supabase:

1. Create a backup in the Supabase dashboard before every production release.
2. Record backup timestamp and release commit ID.
3. Confirm the backup includes auth, public schema, storage metadata, and functions.

CLI/direct Postgres option when `DATABASE_URL` is available:

```bash
mkdir -p backups
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file "backups/automation-factory-$(date +%Y%m%d-%H%M%S).dump"
```

## Storage backup

If Supabase Storage is used:

1. Identify `STORAGE_BUCKET`.
2. Export bucket objects through Supabase tooling or provider dashboard.
3. Store backup outside the production server.
4. Record object count and backup timestamp.

## Backup schedule

- Before every migration release
- Daily during beta
- Weekly after GA if traffic is low
- Immediately before payment/provider changes

## Verification

- [ ] Backup file exists
- [ ] Backup timestamp recorded
- [ ] Restore procedure reviewed
- [ ] Backup is stored off-server
