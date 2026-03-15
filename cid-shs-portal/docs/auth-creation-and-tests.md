Admin creation & auth test — notes

Overview

This document records the scripts, commands, and observed results from attempts to create an admin account, obtain a JWT, and call protected endpoints. Use the commands below manually in PowerShell (or adapt for your shell).

Files created

- scripts/create-admin.js  — creates an admin record (hashes password with bcrypt)
- scripts/set-admin-password.js — updates an admin's password (hashes and writes to DB)
- scripts/test-auth.js / test-auth-user.js — small node scripts that POST to /api/auth/login and call /api/students
- scripts/list-admins.js — lists rows in `admins` for debugging

What I attempted (summary)

1. Created `create-admin.js` to insert an admin (username and bcrypt password).
2. Tried to run it here; missing packages were installed (`bcryptjs`, `dotenv`).
3. Ran `create-admin.js admin_local strongPassword123` — reported "Admin created with id: 3".
4. Attempted to login via POST /api/auth/login — response showed `{"message":"Invalid credentials"}`.
5. Inspected DB rows for `admins` — found admin entries and bcrypt hashes. Some compares with `bcrypt.compare` returned `false` (did not match expected password). To address this, I added `set-admin-password.js` and updated `admin_local` password; the update ran and returned success.
6. Login still returned "Invalid credentials" in some quick tests; additional debugging attempts showed that the login endpoint uses the `password` column from the `admins` table (matching `shs.sql`). After ensuring the hashed password is in `admins.password`, re-run the login test should succeed.

Observed issues and notes

- When running combined terminal commands that start the server and then immediately do HTTP calls, server logs can interleave with command output. Run steps separately for clarity.
- If login returns `{"message":"Invalid credentials"}`, verify:
  - The admin user exists in the same database your server is pointing to (check `backend/.env` `DB_NAME`).
  - The `admins.password` column contains a bcrypt hash.
  - Use `node -e "require('bcryptjs').compare('<plain>', '<hash>').then(console.log)"` to verify comparisons locally.
- If bcrypt.compare returns `false` for a known password/hash, make sure the hash was generated using the same algorithm and salt rounds (standard `bcryptjs.hash(password, 10)` is correct).

Exact commands to run locally (recommended order)

1) Ensure the DB is imported and `backend/.env` DB_* values match your XAMPP MySQL.

2) Start the backend (in one terminal):

```powershell
cd C:\xampp\htdocs\project\cid-shs-portal\backend
node server.js
```

3) In another terminal, create an admin (if you didn't import seeded admins):

```powershell
cd C:\xampp\htdocs\project\cid-shs-portal
node scripts/create-admin.js admin_local strongPassword123
```

4) Verify admin exists:

```powershell
node scripts/list-admins.js
```

5) Test login to get a token (curl example):

```powershell
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin_local\",\"password\":\"strongPassword123\"}"
```

The response should include `{ "token": "<jwt>" }`.

6) Call a protected endpoint (replace <token>):

```powershell
curl http://localhost:5000/api/students -H "Authorization: Bearer <token>"
```

Expected response: an array of students (or `[]` if none) and NO `401`/`403` error.

If login fails repeatedly

- Use the password-reset helper to set a known password for the admin:

```powershell
node scripts/set-admin-password.js admin_local strongPassword123
```

- Then re-run the login command.
- If `bcrypt.compare` still returns false when tested in Node, re-generate the hash with `bcryptjs.hash` locally and inspect the DB value.

If you want me to stop attempting remote commands in the workspace and just provide instructions, I will — which is now the current state. The background server on port 5000 has been stopped.

If you want me to proceed with the next backend module (Results CRUD or formal API tests), say which item and I will continue.
