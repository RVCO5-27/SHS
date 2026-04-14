
# Admin Login & Role-Based Access

## Admin Credentials
- Username: `admin`
- Password: `admin123`
- Role: `admin`

## Role-Based Access
| Role | Access |
|------|--------|
| admin | /admin/dashboard, /admin/users, /admin/audit-logs |
| user | Basic document access |

## Login URL
`/admin-login-8f23b1`

**Security**: Rate-limited, bcrypt hashed passwords, session-based auth.


