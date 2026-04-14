# Administrator authentication and login architecture

**Shorter cheat sheet:** [LOGIN-AND-RECOVERY-GUIDE.md](./LOGIN-AND-RECOVERY-GUIDE.md)

This document describes how admin sign-in works in the CID SHS Portal: API layout, data model, progressive lockouts, email-based recovery after account block, JWT sessions, forced password changes, audit logging, and how the React app wires routes together.

## Design goals

- **No public “forgot password” flow**: There is no endpoint where a user types an arbitrary email to receive a reset link. That reduces phishing templates and unsolicited reset abuse.
- **Recovery only after real risk signals**: A one-time recovery link is created and emailed when an account hits **five failed password attempts** (blocked). The link goes only to the **DepEd email stored on the admin record**—never keyed in by the user at reset time.
- **Forced password reset after recovery**: The recovery token yields a short-lived JWT with `mustChangePassword: true`. The user must complete **`POST /auth/change-password`** before using the dashboard.
- **Observable security**: Failed logins, lockouts, blocks, recovery usage, and password changes are written to **`audit_logs`** when that table exists.
- **Graceful degradation**: If **`login_attempts`** is missing, the server logs a warning and behaves like a classic login (no per-account lockout or recovery); **`audit_logs`** is also optional.

## High-level architecture

| Layer | Responsibility |
|--------|----------------|
| **Express** | `POST /api/auth/*` routes, validation, rate limiting |
| **`controllers/auth.js`** | Login, recovery consume, change password, JWT issuance |
| **`services/loginAttemptService.js`** | Counters, temporary locks, block + recovery token row + email trigger |
| **`services/recoveryMail.js`** | Builds link `FRONTEND_ORIGIN/admin/reset-access?token=…`, sends via SMTP or logs in dev |
| **`services/authAudit.js`** | Best-effort inserts into `audit_logs` |
| **`middleware/auth.js`** | `authMiddleware` verifies JWT; `requireAdminRole` checks role claim |
| **`middleware/authRateLimiter.js`** | IP-based limiter on **`POST /auth/login`** (failed requests count toward limit) |
| **React** | `AdminLogin`, `AdminRecovery`, `AdminChangePassword`, `PrivateRoute` |

API base URL (frontend): `VITE_API_URL` or `{VITE_API_ORIGIN}/api` (see `frontend/src/services/api.js`). Auth paths are under **`/api/auth`**.

```mermaid
sequenceDiagram
  participant Browser
  participant API as Express /auth
  participant DB as MySQL
  participant Mail as SMTP or console

  Browser->>API: POST /auth/login
  API->>DB: Load admin by username
  API->>DB: checkLoginAllowed (login_attempts)
  alt Wrong password
    API->>DB: recordFailedAttempt
    Note over API,DB: count 3: 2min lock; 4: 5min; 5+: block + token + email
  else Correct password
    API->>DB: resetAttempts, last_login
    API-->>Browser: JWT + mustChangePassword
  end

  Browser->>API: POST /auth/recovery/consume (token from email link)
  API->>DB: Mark token used; must_change_password=1
  API-->>Browser: JWT mustChangePassword true

  Browser->>API: POST /auth/change-password (Bearer JWT)
  API->>DB: New bcrypt hash; clear must_change_password
  API-->>Browser: New JWT
```

## Normal login flow

1. **Route**: `POST /api/auth/login` (`backend/routes/auth.js`).
2. **Validation**: Username (trim, non-empty, max 50), password (non-empty, max **72** for bcrypt safety).
3. **Rate limit**: `authLoginLimiter`—15-minute window, max **30** attempts that **count only failed** responses (`skipSuccessfulRequests: true`).
4. **Lookup**: `selectAdminByUsername` from `utils/adminQuery.js`.
5. **Audit**: Unknown username → `LOGIN_FAIL unknown_user=…` with `admin_id` null.
6. **Gating** (if `login_attempts` exists):
   - **`BLOCKED`** (`is_blocked`): **403** + `code: ACCOUNT_BLOCKED`.
   - **`LOCKED`** (`lock_until` in future): **429** + `code: LOGIN_LOCKED` + `retryAfterSeconds`.
7. **Verification**: `bcrypt.compare` against `admins.password`.
8. **On success**: Reset attempt row (if table exists), update `last_login`, issue JWT (**8h** expiry), include `mustChangePassword` from `admins.must_change_password`.

**Response (success)** includes:

- `token`, `expiresIn: '8h'`, `mustChangePassword`, `user` ({ id, username, role, email? }).

## Failed attempts, temporary lock, and block

Implemented in **`loginAttemptService.js`** and invoked from **`auth.js`** on **wrong password** only (when `login_attempts` is available).

| Failed count | Effect |
|--------------|--------|
| 1–2 | Count incremented; **401** invalid credentials |
| **3** | **2-minute** `lock_until`; **429** `LOGIN_LOCKED`, `retryAfterSeconds: 120` |
| **4** | **5-minute** `lock_until`; **429** `LOGIN_LOCKED`, `retryAfterSeconds: 300` |
| **5+** | `is_blocked = 1`; **403** `ACCOUNT_BLOCKED`; recovery row + email if valid DepEd email |

While `lock_until` is in the future, **`checkLoginAllowed`** returns **`LOCKED`** even before password check—user sees wait time via `retryAfterSeconds`.

**Recovery email** is sent only when `count >= 5`, the admin has a syntactically valid email, and `login_recovery` insert + mail succeed. TTL is **`RECOVERY_TTL_MIN` (15 minutes)**. Tokens are **64 hex characters** (32 random bytes).

If the admin has **no email** on file, the account can still be blocked; the API returns a message directing them to ICT (no self-service recovery).

### Frontend behavior (`AdminLogin.jsx`)

- **429** with `retryAfterSeconds`: Shows inline countdown and disables submit for the wait period.
- When **`code === 'LOGIN_LOCKED'`** and **`retryAfterSeconds === 120`** (third failed attempt / 2-minute lock): a **red, top-right toast** appears (~4s), stackable, non-blocking.
- **403** `ACCOUNT_BLOCKED`: Explains block and email-based recovery (or ICT if no email).
- Copy states there is **no self-service “forgot password”**; recovery is **only after repeated failures** via **on-file email**.

## Recovery flow (email link)

1. Email contains a link built in **`recoveryMail.js`**:  
   `{FRONTEND_ORIGIN}/admin/reset-access?token=<64-hex>`
2. **`AdminRecovery.jsx`** reads `token` from the query string, calls **`POST /api/auth/recovery/consume`** with `{ token }`.
3. **`consumeRecovery`** (`auth.js`):
   - Requires unused row in `login_recovery` with matching token and `expires_at > NOW()`.
   - Sets `used = 1`, sets **`must_change_password = 1`** on the admin, resets login attempts if tracked, returns JWT with **`mustChangePassword: true`**.
4. Frontend stores token and navigates to **`/admin/change-password`**.

There is **no** `POST /auth/forgot` or similar; the user never submits an email for reset.

## Forced password change

- JWT payload includes **`mustChangePassword`** (see `buildPayload` in `auth.js`).
- **`PrivateRoute.jsx`**: If `mustChangePasswordFromStorage()` is true and path is not `/admin/change-password`, redirect to change-password.
- **`POST /api/auth/change-password`**: Requires `Authorization: Bearer <jwt>`.
  - If JWT indicates **must change**, **`currentPassword`** is not required.
  - Otherwise **`currentPassword`** must match the existing hash.
  - New password is validated with **`utils/passwordPolicy.js`**: **8–12** characters, upper, lower, number, special character, banned/common checks.
- Success: Hash updated, `must_change_password` cleared, new JWT returned with `mustChangePassword: false`.

Frontend mirrors rules in **`utils/passwordStrength.js`** and **`AdminChangePassword.jsx`** for immediate feedback.

## JWT and protected routes

- **Sign**: `jsonwebtoken` with secret from **`config/security.js`** (`getJwtSecret()`).
- **Verify**: `authMiddleware` attaches `req.user` (payload includes `id`, `username`, `role`, `mustChangePassword`).
- **Role**: `requireAdminRole` ensures `role` is in configured admin roles (used where enforced on routes).

Logout: **`POST /api/auth/logout`** returns **204**; client drops stored token (stateless JWT—no server session list).

## Database structure (relevant objects)

Defined in **`database/shs.sql`** and incremental **`database/auth_login_security.sql`**.

| Table / column | Purpose |
|----------------|---------|
| `admins.email` | DepEd email for recovery (must be set for email recovery) |
| `admins.must_change_password` | Forces redirect to change-password when `1` |
| `admins.password` | bcrypt hash |
| `login_attempts` | Per-admin `attempt_count`, `lock_until`, `is_blocked`, cached `email` |
| `login_recovery` | One-time `token` (CHAR 64), `expires_at`, `used` |
| `audit_logs` | `admin_id`, `action` (VARCHAR 255), `ip_address`, `timestamp` |

If `login_attempts` is absent at process start, **`attemptsTableAvailable`** is false until the table is created and the app restarted (or code path re-probed—currently on startup only).

## Audit events (representative `action` values)

Written by **`authAudit.logAuthEvent`** when `audit_logs` exists. Examples:

| Action | When |
|--------|------|
| `LOGIN_FAIL unknown_user=…` | Username not found |
| `LOGIN_REJECTED_ACCOUNT_BLOCKED` | Login blocked at gate or right after 5th fail |
| `LOGIN_REJECTED_TEMP_LOCK` | Login during active `lock_until` |
| `LOGIN_FAIL count=N user=…` | Recorded inside `recordFailedAttempt` |
| `LOCKOUT_2MIN_APPLIED` / `LOCKOUT_5MIN_APPLIED` | Third / fourth failure |
| `ACCOUNT_BLOCKED recovery_email=sent\|skipped_or_failed` | Fifth+ failure path |
| `LOGIN_FAIL_WRONG_PASSWORD no_attempt_tracking` | Wrong password, no attempts table |
| `LOGIN_FAIL_NO_PASSWORD_HASH` | Missing hash on account |
| `LOGIN_ATTEMPTS_RESET_AFTER_SUCCESS` | Successful login cleared attempts |
| `LOGIN_SUCCESS` | Successful login |
| `RECOVERY_TOKEN_REJECTED …` | Bad or expired consume |
| `RECOVERY_TOKEN_CONSUMED` | Valid consume |
| `PASSWORD_CHANGED` | Successful change-password |

Client IP is taken from `X-Forwarded-For` (first hop) or `socket.remoteAddress`.

## Environment variables (auth-related)

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` (or as required by `src/config/security.js`) | JWT signing |
| `FRONTEND_ORIGIN` | Base URL for recovery links (default `http://localhost:5173`) |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM` | Real email delivery; if unset, link is **logged to console** in development |

## Frontend routes (`App.jsx`)

| Path | Component |
|------|-----------|
| `/admin/login` | `AdminLogin` (with `RequireHttps` in production pattern) |
| `/admin/reset-access?token=…` | `AdminRecovery` |
| `/admin/change-password` | `AdminChangePassword` |
| `/admin/dashboard`, `/admin/students`, … | Wrapped in `PrivateRoute` + admin `Layout` |

Legacy redirects: `/login` → `/admin/login`, etc.

## File map (quick reference)

| Area | Path |
|------|------|
| Routes | `backend/routes/auth.js` |
| Controller | `backend/controllers/auth.js` |
| Attempts / recovery | `backend/services/loginAttemptService.js` |
| Email | `backend/services/recoveryMail.js` |
| Audit | `backend/services/authAudit.js` |
| Policy | `backend/utils/passwordPolicy.js` |
| Admin DB helpers | `backend/utils/adminQuery.js` |
| Login UI | `frontend/src/pages/AdminLogin.jsx`, `AdminLogin.css` |
| Recovery page | `frontend/src/pages/AdminRecovery.jsx` |
| Change password | `frontend/src/pages/AdminChangePassword.jsx` |
| Gate | `frontend/src/components/PrivateRoute.jsx` |
| API client | `frontend/src/services/api.js` |

## Operational checklist

1. Apply schema: run **`database/shs.sql`** or **`database/auth_login_security.sql`** as appropriate; ensure **`admins.email`** is populated for accounts that should self-recover.
2. Set **`JWT_SECRET`** in production.
3. Configure **SMTP** for production recovery emails; verify **`FRONTEND_ORIGIN`** matches the deployed SPA origin (HTTPS).
4. Monitor **`audit_logs`** for lockouts, blocks, and recovery usage.

---

*This document reflects the security-hardened admin login model: conditional recovery, no manual email entry for reset, progressive lockouts, forced password update after recovery, and centralized audit logging.*
