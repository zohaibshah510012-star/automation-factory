# Auth / Beta Access Verification

Last updated: 2026-07-17

Status: **VERIFIED for linked Supabase + local production preview**

Closed Beta impact: Auth/Beta Access P0 is functionally verified for the current linked Supabase project and local standalone production preview. Final production-domain acceptance still depends on the production smoke test.

Scope: verification only. No business code, AI Runtime, Workflow Engine, Billing Core, Credits Core, or database schema changes were made.

## Environment

| Item | Result |
| --- | --- |
| Local preview URL | `http://127.0.0.1:3001` |
| Health check | `200`, `{"status":"ok","database":true}` |
| Linked Supabase project ref | `rfghzowaeqojvnxiqznc` |
| Remote migration state | `0001` through `0032` listed by `supabase migration list` |
| `.env.local` `ADMIN_EMAILS` | present |
| `.env.local` Supabase URL / anon key / service role key | present |
| `.env.local` `BETA_INVITE_ONLY` | missing; runtime default and test process used invite-only mode |
| `.env.production.example` `BETA_INVITE_ONLY` | `true` |

## Auth configuration checked

Code paths reviewed:

- `src/app/api/auth/bootstrap/route.ts`
- `src/app/api/beta/invites/verify/route.ts`
- `src/app/api/admin/beta/invites/route.ts`
- `src/lib/request-auth.ts`
- `src/lib/beta-invite-service.ts`
- `src/lib/workspace-service.ts`
- `src/app/beta/page.tsx`
- `src/app/dashboard/page.tsx`

Verified behavior from code:

- `/api/auth/bootstrap` reads `ADMIN_EMAILS`.
- `/api/auth/bootstrap` defaults invite-only behavior to enabled unless `BETA_INVITE_ONLY=false`.
- Non-admin first bootstrap requires an invite code when invite-only mode is active.
- `/api/beta/invites/verify` validates email + invite code.
- Beta invite consumption changes invite status to `used` and writes `used_at`.
- Workspace creation uses authenticated user token and writes `workspaces` plus `workspace_members`.
- Admin APIs require admin role or bootstrap admin email.

## Controlled test user

| Field | Value |
| --- | --- |
| Test email | `beta-p0-20260717102227@automation-factory.test` |
| Invite code | `BETA-P0-17102227` |
| Uninvited negative-test email | `beta-p0-uninvited-20260717102227@automation-factory.test` |
| Password/token evidence | not recorded, not committed |

## Verification result

| Step | Result | Evidence |
| --- | --- | --- |
| Invite created | PASS | `beta_invites.status=pending`, invite id masked as `ba6bc102...ef88` |
| Invite verified | PASS | `/api/beta/invites/verify` returned `200`, `{ "ok": true }` |
| User created | PASS | Supabase Auth admin create user succeeded, user id masked as `dc323be5...96c0` |
| Login | PASS | Supabase password login returned a session |
| Bootstrap/Profile | PASS | `/api/auth/bootstrap` returned `200`; profile role `customer`, status `active`, credits `1000` |
| Invite consumed | PASS | `beta_invites.status=used`, `used_at` set |
| Workspace created | PASS | `/api/workspaces` returned `201`, workspace id masked as `1b5e682e...008f` |
| Workspace list | PASS | `/api/workspaces` returned `200`, count `1` |
| Profile database check | PASS | `profiles` row exists for the test user |
| Workspace membership check | PASS | `workspace_members` row exists, role `owner`, status `active` |
| Dashboard | PASS | `/dashboard` returned `200`, `text/html; charset=utf-8` |
| Customer admin permission | PASS | `/api/admin/users` returned `403` for the customer token |
| Uninvited user gate | PASS | uninvited user bootstrap without invite returned `401` |

Overall result: **PASS**

## Sanitized log evidence

Evidence location: this section records the sanitized command result. Raw bearer tokens, passwords, service role key, and anon key were not printed or committed.

```json
{
  "timestamp": "2026-07-17T10:22:27.827Z",
  "baseUrl": "http://127.0.0.1:3001",
  "projectRef": "rfghzowaeqojvnxiqznc",
  "email": "beta-p0-20260717102227@automation-factory.test",
  "inviteCode": "BETA-P0-17102227",
  "checks": {
    "invite_created": { "ok": true, "id": "ba6bc102...ef88", "status": "pending", "used_at": null },
    "invite_verified": { "ok": true, "status": 200, "response": { "ok": true } },
    "user_created": { "ok": true, "user_id": "dc323be5...96c0", "email_confirmed": true },
    "login": { "ok": true, "has_session": true, "user_id": "dc323be5...96c0" },
    "bootstrap": {
      "ok": true,
      "status": 200,
      "profile": {
        "id": "dc323be5...96c0",
        "email": "beta-p0-20260717102227@automation-factory.test",
        "role": "customer",
        "status": "active",
        "credits_balance": 1000
      }
    },
    "invite_consumed": { "ok": true, "status": "used", "used_at_set": true },
    "workspace_created": {
      "ok": true,
      "status": 201,
      "workspace": {
        "id": "1b5e682e...008f",
        "name": "Beta P0 Workspace 20260717102227",
        "slug": "beta-p0-20260717102227"
      }
    },
    "workspace_list": { "ok": true, "status": 200, "count": 1 },
    "profile_db": {
      "ok": true,
      "profile": {
        "id": "dc323be5...96c0",
        "email": "beta-p0-20260717102227@automation-factory.test",
        "role": "customer",
        "status": "active",
        "credits_balance": 1000
      }
    },
    "workspace_member_db": { "ok": true, "role": "owner", "status": "active" },
    "dashboard_page": { "ok": true, "status": 200, "content_type": "text/html; charset=utf-8" },
    "customer_admin_denied": { "ok": true, "status": 403 },
    "uninvited_blocked": {
      "ok": true,
      "status": 401,
      "response": { "error": "Unable to initialize account" }
    }
  },
  "uninvitedEmail": "beta-p0-uninvited-20260717102227@automation-factory.test",
  "overall": "PASS"
}
```

## Permissions result

- Test customer received `customer` role.
- Test customer could create/list own workspace.
- Test customer could load `/dashboard`.
- Test customer could not access `/api/admin/users`; response was `403`.
- Uninvited user could authenticate at Supabase level but could not bootstrap into the app; response was `401`.

## Remaining production-domain check

This verification used the current local production preview against the linked Supabase project. The production launch still needs a domain-level smoke test after VPS/Nginx/SSL are running:

- `https://<production-domain>/api/health`
- `https://<production-domain>/beta?invite_code=<code>`
- `https://<production-domain>/dashboard`
- production Supabase Auth redirect URL validation
