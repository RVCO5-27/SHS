# Admin login and account recovery — quick guide

This is a **companion** to [`ADMIN-AUTH-AND-LOGIN.md`](./ADMIN-AUTH-AND-LOGIN.md). That file is the deep architecture reference; this one is a **short operational and developer cheat sheet**.

## What the user sees

1. **Sign in** at `/admin/login` with username + password.
2. There is **no “Forgot password”** link. Password reset is **not** started by typing an email on the site.
3. After **too many wrong passwords**, the UI may show a **short lockout** (timer) or **account blocked** messaging.
4. If the account is **blocked** and a **DepEd email** exists on the admin record, the system emails a **one-time link** (valid about **15 minutes**). The user opens `/admin/reset-access?token=…` (see exact path below).
5. After using that link, the user **must set a new password** before the dashboard works. New passwords must be **8–12 characters** with **uppercase, lowercase, number, and special character**.

**Recovery URL path (frontend):** `/admin/reset-access?token=<64-character-hex>`

## Failure progression (per admin account)

| Stage | Backend behavior (when `login_attempts` exists) |
|--------|-----------------------------------------------|
| Wrong password #1–2 | 401 “Invalid credentials”; counter increases |
| Wrong password #3 | 429, ~**2 minute** wait (`retryAfterSeconds: 120`) |
| Wrong password #4 | 429, ~**5 minute** wait (`retryAfterSeconds: 300`) |
| Wrong password #5 | **403** `ACCOUNT_BLOCKED`; row in `login_recovery` + email if SMTP + email ok |

While a **temporary lock** is active, login is rejected with **429** even before checking the password.

## API cheat sheet

Base: `{API}/auth` (usually `{origin}/api/auth`).

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| POST | `/login` | No | Body: `{ username, password }`. Rate-limited. |
| POST | `/recovery/consume` | No | Body: `{ token }` (exactly 64 hex chars). Returns JWT with `mustChangePassword: true`. |
| POST | `/change-password` | Bearer JWT | Body: `{ newPassword }` if forced change, else `{ currentPassword, newPassword }`. |
| POST | `/logout` | No | 204; client clears token. |

**Typical success responses:** Login and change-password return a **new `token`**; store it (e.g. `localStorage`) and send `Authorization: Bearer <token>` on admin API calls.

## Environment variables (recovery email)

| Variable | Role |
|----------|------|
| `FRONTEND_ORIGIN` | Host used in the recovery link (no trailing slash). Default dev: `http://localhost:5173`. |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | If set, recovery is emailed; if not, the link is **logged to the server console** (dev-style). |
| Optional | `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM` |

## Database expectations

- **`admins.email`** — Must be set for **automatic** recovery after block.
- **`login_attempts`** — Tracks counts and locks; if missing, login still works but **without** per-account lockout/recovery integration (see server warning on startup).
- **`login_recovery`** — Stores single-use tokens.
- **`audit_logs`** — Optional; records login failures, lockouts, blocks, recovery, password changes when present.

Migration helpers: `database/auth_login_security.sql` and the admin section of `database/shs.sql`.

## Troubleshooting

| Symptom | Things to check |
|---------|-------------------|
| Blocked but no email | `admins.email` empty or invalid; or SMTP not configured / failing (check server logs). |
| Recovery link “invalid or expired” | Older than TTL; token already used; wrong app origin copying only part of URL. |
| Stuck on change-password redirect | JWT has `mustChangePassword: true` until `POST /change-password` succeeds; clear bad tokens via sign-out / remove `localStorage` token if testing. |
| No lockouts at all | `login_attempts` table absent or DB not migrated; restart API after creating tables. |

## Key source files

- Backend: `backend/routes/auth.js`, `backend/controllers/auth.js`, `backend/services/loginAttemptService.js`, `backend/services/recoveryMail.js`, `backend/services/authAudit.js`
- Frontend: `frontend/src/pages/AdminLogin.jsx`, `AdminRecovery.jsx`, `AdminChangePassword.jsx`, `frontend/src/components/PrivateRoute.jsx`

For sequence diagrams and full field-level detail, use [**ADMIN-AUTH-AND-LOGIN.md**](./ADMIN-AUTH-AND-LOGIN.md).
