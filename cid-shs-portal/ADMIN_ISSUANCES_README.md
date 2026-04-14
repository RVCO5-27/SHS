# Admin Issuances Management System

## Local Setup
1. Ensure MySQL is running.
2. Run migration script: `node backend/scripts/migrate_admin_issuances.js`
3. Restart backend server.
4. Access via sidebar link "Issuances Mgmt" in Admin Dashboard.

## Environment Variables
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Database credentials.
- `JWT_SECRET`: Secret for authentication tokens.

## API Documentation (Admin)
- `GET /api/admin/issuances-mgmt/folders`: Fetch hierarchical folder tree.
- `POST /api/admin/issuances-mgmt/issuances`: Create issuance with multi-file upload.
- `POST /api/admin/issuances-mgmt/issuances/bulk`: Bulk publish/delete records.

## Security Features
- Rate limiting: 10 uploads/min per user.
- Malware scanning (Mock): Validates files during upload.
- Audit logging: All changes are captured in `audit_logs` table.
