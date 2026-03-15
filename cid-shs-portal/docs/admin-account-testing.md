# Admin account testing

This document explains how to create and manage admin accounts for local testing, and how to run the auth-related tests in this repository.

## Scripts

- `scripts/create-admin.js <username> <password>` — create a new admin. Example:

```bash
cd backend
node ../scripts/create-admin.js test_admin StrongPass!234
```

- `scripts/set-admin-password.js <username> <newPassword>` — update an existing admin's password. Example:

```bash
cd backend
node ../scripts/set-admin-password.js test_admin NewStrong!456
```

Notes about the scripts:
- Both scripts hash the password with `bcrypt` before writing to the database.
- Both scripts enforce a minimum password length (8 characters) and reject common weak passwords (e.g. `qwerty`, `123456`, `password`).

## Common test accounts

The test suites include and expect admin accounts created during test setup. Examples used in tests (created/removed automatically by tests):

- `test_admin` — password used in `tests/auth.test.js`: `testPass123!` (created by the test harness)
- `test_admin_students` — password used in `tests/students.test.js`: `adminPass!234`

Do not rely on these being present in your local DB; tests create and delete them in `beforeAll`/`afterAll` blocks.

## Database table

Admins are stored in the `admins` table. To inspect accounts locally, use your MySQL client (example using `mysql`):

```sql
USE shs;
SELECT id, username, full_name, role, created_at FROM admins;
-- password column contains bcrypt hash; do NOT attempt to reverse it.
```

## Running the auth tests locally

From the `backend` folder:

```bash
npm install
npm test
```

If you get errors about an unknown database, import the SQL schema found at `database/shs.sql` into your local MySQL server.

## Security and safe testing notes

- The scripts do NOT store or log plaintext passwords. They only accept a password via CLI and store a bcrypt hash in the DB.
- For safety, the repository blocks common weak passwords when creating or updating admins. If you need to use a very weak password for debugging, create the account directly in the DB (not recommended) or modify the script locally.
- Never commit real admin credentials to the repository.

## Troubleshooting

- If login fails with `Invalid credentials`, try resetting the admin password with `scripts/set-admin-password.js`.
- If tests report open handles in Jest, ensure the server is not started directly (the codebase starts the server only when run directly) and that the DB pool is closed by the tests.

## Next steps

- To automate production-ready admin provisioning, consider adding an environment-controlled bootstrapping script that only runs in safe CI or provisioning environments.
