# Restore Procedure

## Database restore

Use this only after confirming rollback cannot solve the incident.

Managed Supabase:

1. Put the app in maintenance mode at Nginx or hosting layer.
2. Stop PM2/Docker app process.
3. Restore the selected Supabase backup from the dashboard.
4. Verify migration state through `supabase migration list`.
5. Start the app.
6. Run `/api/health` and `/admin/checklist`.

Direct Postgres restore when `DATABASE_URL` is available:

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$DATABASE_URL" backups/<backup-file>.dump
```

## Storage restore

1. Recreate the target bucket if needed.
2. Upload backed-up objects.
3. Verify object permissions.
4. Run a user smoke test for image/video/content assets.

## Post-restore checks

- [ ] `/api/health` is healthy
- [ ] `/admin/system` has no ERROR items
- [ ] `/admin/checklist` reviewed
- [ ] User login works
- [ ] Credits balance is consistent
- [ ] Billing and payment records are consistent
- [ ] Content assets load

## Incident notes

Record:

- Incident time
- Release commit
- Backup used
- Data loss window, if any
- Root cause
- Follow-up fix
