# Audit Logging System - Testing Guide

## Quick Start Testing

Your audit logging system is now fully integrated! All user actions are being logged automatically. Here's how to test it.

---

## 1. Test Login Auditing

### Steps:
1. Navigate to `/admin/login`
2. Enter valid admin credentials and login
3. Logout using the logout button

### Expected Result:
- Login action logged with: user_id, action_type='LOGIN', ip_address, user_agent, timestamp
- Logout action logged with: user_id, action_type='LOGOUT', timestamp

### Verify:
```bash
# SSH to your server and run:
mysql> SELECT * FROM audit_logs WHERE action_type IN ('LOGIN', 'LOGOUT') ORDER BY timestamp DESC LIMIT 5;
```

---

## 2. Test File Upload Auditing

### Steps:
1. Go to admin dashboard
2. Upload a document/file (via upload endpoint)
3. Check audit logs

### Expected Result:
- Upload logged with:
  - action_type='UPLOAD'
  - resource_type='file'
  - file size captured
  - original filename stored

### Verify:
```bash
mysql> SELECT user_id, action_type, resource_id, description FROM audit_logs WHERE action_type = 'UPLOAD' ORDER BY timestamp DESC LIMIT 3;
```

---

## 3. Test School Management Auditing

### Steps:
1. Go to `/admin/schools`
2. Create a new school record
3. Edit the school (change name, principal, etc.)
4. Delete the school

### Expected Results:

**Create:**
- action_type='CREATE', module='schools'
- Full school data stored in new_value
- Description: "Created school: [school_name]"

**Update:**
- action_type='UPDATE', module='schools'
- old_value contains previous values
- new_value contains updated values
- diff_snapshot shows what changed
- Description: "Updated school: [school_name]"

**Delete:**
- action_type='DELETE', module='schools'
- Full previous school data in old_value
- Description: "Deleted school: [school_name]"

### Verify:
```bash
mysql> SELECT id, user_id, action_type, module, description, timestamp FROM audit_logs WHERE module = 'schools' ORDER BY timestamp DESC LIMIT 10;
```

---

## 4. Test Issuance Management Auditing

### Steps:
1. Go to `/admin/issuances-mgmt`
2. Create a new issuance
3. Update the issuance (edit title, category, etc.)
4. Archive/delete the issuance

### Expected Results:

**Create:**
- action_type='CREATE', module='issuances'
- resource_type='issuance'
- Title, doc_number, status captured

**Update:**
- action_type='UPDATE'
- diff_snapshot shows changed fields
- Both old and new values preserved

**Delete:**
- action_type='DELETE'
- Previous issuance state stored

### Verify:
```bash
mysql> SELECT id, action_type, resource_type, description FROM audit_logs WHERE module = 'issuances' ORDER BY timestamp DESC LIMIT 10;
```

---

## 5. Test User Management Auditing

### Steps:
1. Go to `/admin/users` (if available)
2. Create a new admin user
3. Edit the user (change email, role, password)
4. Delete the user

### Expected Results:

Each action logged with:
- action_type='CREATE'/'UPDATE'/'DELETE'
- module='users'
- resource_type='admin'
- Descriptive message
- IP address and user agent captured

### Verify:
```bash
mysql> SELECT id, user_id, action_type, description, timestamp FROM audit_logs WHERE module = 'users' ORDER BY timestamp DESC LIMIT 10;
```

---

## 6. Test Admin Dashboard Audit Log Viewer

### Steps:
1. Go to `/admin/audit-logs`
2. View the audit log table
3. Search for a specific user action
4. Filter by action type (CREATE, UPDATE, DELETE)
5. Click "Details" on any log to see full details
6. Try the CSV export function

### Expected Results:
- All logged actions visible in table
- Search filters working
- Modal shows old/new value comparison
- CSV download works

---

## 7. Test Immutability Constraints

### Steps:
1. Log in to MySQL directly
2. Try to modify an audit log record
3. Try to delete an audit log record

### Expected Result:
```
ERROR 1422: Explicit or implicit commit is not allowed in stored function or trigger.
```

This confirms that the database triggers are preventing unauthorized modification of audit logs.

### Verify:
```bash
# This should fail
mysql> UPDATE audit_logs SET action_type = 'TEST' WHERE id = 1;

# This should fail
mysql> DELETE FROM audit_logs WHERE id = 1;
```

---

## 8. Test SQL Injection Prevention

All queryparameters are passed via prepared statements with `?` placeholders.

### Manual Verification:
1. In audit logs search, try entering: `'; DROP TABLE audit_logs; --`
2. The search should treat it as a literal string, not SQL
3. No error should indicate protection is working

---

## 9. Full Workflow Integration Test

### Scenario: Complete User Flow
1. Admin A logs in
2. Admin A creates a new school "Test High School"
3. Admin A uploads a document about the school
4. Admin A creates an issuance referencing the school
5. Admin A updates the issuance title
6. Admin B logs in
7. Admin B views the audit logs
8. Admin B sees all Admin A's actions with IP, timestamp, details

### Verify All Logs:
```bash
mysql> SELECT 
  id, 
  user_id, 
  action_type, 
  module, 
  description, 
  ip_address, 
  DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') as logged_at
FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 20;
```

---

## 10. Performance Verification

The audit logging should have minimal impact on performance.

### Check Query Performance:
```bash
# Check audit log table size
mysql> SHOW TABLE STATUS WHERE Name = 'audit_logs' \G

# Sample query time
mysql> SELECT COUNT(*) FROM audit_logs;

# Index usage
mysql> EXPLAIN SELECT * FROM audit_logs WHERE user_id = 1 AND timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY);
```

Expected: Should use indexes (idx_user_id, idx_timestamp) for fast queries

---

## Troubleshooting

### Logs Not Appearing

**Problem:** No logs showing up after actions
**Solution:**
1. Check server console for audit service errors (look for `[auditService]` prefix)
2. Verify database connection is working
3. Ensure `req.user.id` is being populated in controllers
4. Check if audit_logs table has data: `SELECT COUNT(*) FROM audit_logs;`

### Missing Fields

**Problem:** Some audit logs missing user_id or ip_address
**Solution:**
1. Verify `getClientIp(req)` is correctly extracting IP
2. Check middleware is attaching `req.user`
3. Trace the controller to ensure req.user is available

### Immutability Not Working

**Problem:** Can still UPDATE/DELETE audit logs
**Solution:**
1. Verify triggers were created: 
   ```bash
   mysql> SHOW TRIGGERS WHERE Trigger LIKE '%audit%';
   ```
2. If triggers missing, call `ensureImmutable()`:
   ```bash
   # In server console, manually call:
   node -e "require('./backend/services/auditService').ensureImmutable().then(() => process.exit(0))"
   ```

### High Performance Impact

**Problem:** Audit logging seems slow
**Solution:**
1. All audit functions are non-blocking (errors logged but don't throw)
2. Verify indexes exist: `SHOW INDEX FROM audit_logs;`
3. Consider archiving old logs if table grows very large

---

## Database Queries for Analysis

### Find Most Active Users
```sql
SELECT 
  user_id, 
  COUNT(*) as action_count,
  GROUP_CONCAT(DISTINCT action_type) as actions
FROM audit_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY user_id
ORDER BY action_count DESC;
```

### Find Most Edited Resources
```sql
SELECT 
  resource_id, 
  resource_type,
  COUNT(*) as edit_count,
  MAX(timestamp) as last_edited
FROM audit_logs
WHERE action_type IN ('UPDATE', 'DELETE')
GROUP BY resource_id
ORDER BY edit_count DESC
LIMIT 20;
```

### Find Failed Actions
```sql
SELECT * FROM audit_logs
WHERE action_type = 'LOGIN' 
  AND description LIKE '%false%'
ORDER BY timestamp DESC
LIMIT 20;
```

### Audit Trail for Specific Resource
```sql
SELECT 
  timestamp,
  user_id,
  action_type,
  old_value,
  new_value,
  diff_snapshot
FROM audit_logs
WHERE resource_id = ? AND resource_type = ?
ORDER BY timestamp ASC;
```

---

## Summary Checklist

- [ ] Login/logout actions logged
- [ ] File uploads logged with file size
- [ ] School create/update/delete logged
- [ ] Issuance create/update/delete logged
- [ ] User create/update/delete logged
- [ ] Audit log dashboard accessible at /admin/audit-logs
- [ ] Search and filtering working
- [ ] CSV export working
- [ ] Immutability triggers preventing modification
- [ ] No SQL injection vulnerabilities
- [ ] Performance acceptable (no noticeable slowdown)

---

## Next Steps

Once all tests pass:
1. Monitor audit logs in production
2. Set up retention policy (archive logs > 90 days)
3. Configure alerts for suspicious patterns (multiple failed logins, bulk deletes)
4. Generate compliance reports from audit logs

