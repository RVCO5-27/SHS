# Phase 1: Critical Audit Implementation Guide
## April 16, 2026

---

## ✅ What's Been Implemented

### 1. Database Schema Updates
- ✅ **shs.sql** - Updated `action_type` enum with 34 total action types (8 base + 26 new critical)
- ✅ **002_add_critical_audit_actions.sql** - Migration file with:
  - 7 new optional fields for enhanced auditing (reason, approval_id, session_id, request_id, etc.)
  - Performance indexes on all new fields
  - Composite indexes for common queries
  - 2 views for querying critical/failed operations
  - 2 stored procedures for log archival and retention

### 2. New Audit Service Functions (auditService.js)
- ✅ **logSessionTimeout()** - Track session expirations
- ✅ **logRoleChange()** - Track role modifications (Admin ↔ SuperAdmin)
- ✅ **logAccountStatusChange()** - Track status changes (active → suspended)
- ✅ **logConfigChange()** - Track system configuration changes
- ✅ **logBackupCreated()** - Track backup operations with size/duration
- ✅ **logBackupRestored()** - Track backup restorations
- ✅ **logCriticalError()** - Track system errors and exceptions

### 3. Controller Integrations
- ✅ **auth.js** - Added imports for logSessionTimeout and logCriticalError
- ✅ **adminUserController.js** - Enhanced updateUser() to log role changes separately

### 4. New Action Types Available

| Category | Action Types | Purpose |
|----------|--------------|---------|
| **Core CRUD** | CREATE, UPDATE, DELETE, UPLOAD, DOWNLOAD, VIEW | Basic operations |
| **Authentication** | LOGIN, LOGOUT, PASSWORD_RESET, ACCOUNT_LOCKOUT, SESSION_TIMEOUT | Auth tracking |
| **Security** | AUTHENTICATION_BYPASS_ATTEMPT, CRITICAL_ERROR, PERMISSION_DENIED | Security events |
| **Admin/User** | ROLE_CHANGE, ACCOUNT_STATUS_CHANGE, ADMIN_PASSWORD_RESET, BULK_USER_IMPORT | User management |
| **Content** | PUBLICATION_STATUS_CHANGE, FILE_ATTACHMENT, VISIBILITY_CHANGE | Content ops |
| **System** | SECURITY_SETTING_CHANGE, API_KEY_GENERATED, API_KEY_REVOKED, RATE_LIMIT_CHANGE | Config changes |
| **Database** | BACKUP_CREATED, BACKUP_RESTORED, SCHEMA_MIGRATION, MAINTENANCE_TASK | DB operations |
| **Data** | DATA_VALIDATION_FAILED, CAROUSEL_OPERATION, ORGCHART_CHANGE, MALWARE_SCAN_ALERT | Data events |
| **Integration** | EMAIL_VERIFICATION | External integrations |

---

## 🚀 Usage Examples

### Example 1: Log a Session Timeout
```javascript
const { logSessionTimeout, getClientIp, getUserAgent } = require('../services/auditService');

// When user session expires
const sessionDurationMs = Date.now() - sessionStartTime;
await logSessionTimeout(
  userId,
  sessionDurationMs,
  getClientIp(req),
  getUserAgent(req)
);
```

### Example 2: Log a Role Change
```javascript
const { logRoleChange, getClientIp, getUserAgent } = require('../services/auditService');

// When admin promotes user
await logRoleChange(
  adminId,        // Who made the change
  userId,         // Who is affected
  'Admin',        // From role
  'SuperAdmin',   // To role
  'Promoted due to promotion request',
  getClientIp(req),
  getUserAgent(req)
);
```

### Example 3: Log a Backup Operation
```javascript
const { logBackupCreated, formatBytes } = require('../services/auditService');

// Backup completed
const startTime = Date.now();
// ... backup code ...
const duration = Date.now() - startTime;

await logBackupCreated(
  adminId,
  'backup_20260416_180000.sql',
  1073741824,      // Database size: 1 GB
  536870912,       // Backup size: 512 MB
  duration,
  'SUCCESS'        // or 'FAILED'
);
```

### Example 4: Log a Critical Error
```javascript
const { logCriticalError, getClientIp, getUserAgent } = require('../services/auditService');

// Inside error handler
try {
  // ... some operation ...
} catch (err) {
  await logCriticalError(
    req.user?.id || null,
    '500',
    err.message,
    req.path,
    err.stack,
    getClientIp(req),
    getUserAgent(req)
  );
  next(err);
}
```

### Example 5: Log Config Change
```javascript
const { logConfigChange, getClientIp, getUserAgent } = require('../services/auditService');

// When rate limit is changed
await logConfigChange(
  adminId,
  'RATE_LIMIT_API',
  100,         // Old value
  200,         // New value
  'Increased API rate limit to handle peak load',
  getClientIp(req),
  getUserAgent(req)
);
```

---

## 📋 Integration Checklist for Phase 1

### Account Lockout Logging (auth.js)
- [ ] When account is locked: Log `ACCOUNT_LOCKOUT` action
- [ ] Code location: `auth.js` - Around line 78 when `gate.code === 'LOCKED'`
- [ ] Fields to log: user_id, attempt_count, ip_address, user_agent

### Session Timeout Tracking
- [ ] Add middleware to track session start time
- [ ] Log timeout when JWT validation fails
- [ ] Code location: TBD (middleware/auth.js or JWT verification)

### Account Status Changes
- [ ] Create endpoint to update user status (if not exists)
- [ ] Code location: `adminUserController.js` - new endpoint needed
- [ ] Call `logAccountStatusChange()` when status modified

### Configuration Changes
- [ ] Identify all system setting endpoints
- [ ] Add `logConfigChange()` calls
- [ ] Code locations: TBD (identify config endpoints)

### Error Tracking
- [ ] Add global error handler integration
- [ ] Log critical errors automatically
- [ ] Code location: `middleware/errorHandler.js`

### Backup Operations
- [ ] Create backup endpoint/script
- [ ] Add `logBackupCreated()` and `logBackupRestored()` calls
- [ ] Code location: TBD (backup service)

### Account Lockout (admin.js)
- [ ] If there's a manual account lock endpoint
- [ ] Log `ACCOUNT_LOCKOUT` with reason
- [ ] Code location: TBD (admin management controller)

---

## 🔧 Next Steps

### Immediate (This Week)
1. **Run the migration script**
   ```bash
   mysql -u root -p shs < database/migrations/002_add_critical_audit_actions.sql
   ```

2. **Integrate Account Lockout Logging**
   - Edit: `backend/controllers/auth.js`
   - Add account lockout logging when attempts exceeded

3. **Add Account Status Change Endpoint**
   - Create new endpoint to change user status
   - Add logAccountStatusChange() call
   - Protect with SuperAdmin-only access

### Short Term (Week 2)
4. **Integrate Error Tracking**
   - Edit: `backend/middleware/errorHandler.js`
   - Add logCriticalError() to catch blocks

5. **Create Backup Logging Integration**
   - Create backup service if not exists
   - Add logBackupCreated() and logBackupRestored() calls

6. **Test All New Audit Points**
   - Run through each action to verify logging
   - Check audit dashboard for logs appearing

### Medium Term (Week 3-4)
7. **Add Configuration Change Endpoints**
   - Identify all config endpoints
   - Add logConfigChange() calls
   - Document settings that should be audited

8. **Create Audit Dashboard Filters**
   - Already exists but add filters for new action types
   - Add critical operations view

---

## 📊 Database Migration Notes

### Running the Migration
```bash
# Option 1: From command line
mysql -u root -p shs < cid-shs-portal/database/migrations/002_add_critical_audit_actions.sql

# Option 2: From MySQL client
SOURCE database/migrations/002_add_critical_audit_actions.sql;

# Option 3: Via PHPMyAdmin
- Copy/paste the SQL file content into the SQL tab
- Run it
```

### Verification After Migration
```sql
-- Check if new fields exist
DESC audit_logs;

-- Check if views were created
SHOW VIEWS;

-- Check if indexes exist
SHOW INDEX FROM audit_logs;

-- Check enum values
SHOW CREATE TABLE audit_logs\G
```

### Rollback (if needed)
```sql
-- Only removes added fields/indexes/views (not recommended for production)
ALTER TABLE audit_logs DROP COLUMN reason;
ALTER TABLE audit_logs DROP COLUMN approval_id;
ALTER TABLE audit_logs DROP COLUMN approval_reason;
ALTER TABLE audit_logs DROP COLUMN impact_level;
ALTER TABLE audit_logs DROP COLUMN duration_ms;
ALTER TABLE audit_logs DROP COLUMN session_id;
ALTER TABLE audit_logs DROP COLUMN request_id;
ALTER TABLE audit_logs DROP COLUMN archived_at;

DROP VIEW IF EXISTS critical_audit_operations;
DROP VIEW IF EXISTS failed_audit_operations;
DROP PROCEDURE IF EXISTS prune_archived_audit_logs;
DROP PROCEDURE IF EXISTS archive_old_audit_logs;
```

---

## 🔍 Verification Queries

### Verify Enhanced Audit Logging Works
```sql
-- Check for role changes
SELECT * FROM critical_audit_operations 
WHERE action_type = 'ROLE_CHANGE' 
ORDER BY timestamp DESC LIMIT 10;

-- Check for failed operations
SELECT * FROM failed_audit_operations 
ORDER BY timestamp DESC LIMIT 10;

-- Check for critical errors
SELECT id, user_id, module, description, status, timestamp
FROM audit_logs 
WHERE action_type = 'CRITICAL_ERROR'
ORDER BY timestamp DESC LIMIT 10;

-- Check backup operations
SELECT id, user_id, description, new_value, status, timestamp
FROM audit_logs
WHERE action_type IN ('BACKUP_CREATED', 'BACKUP_RESTORED')
ORDER BY timestamp DESC;
```

### Verify New Indexes
```sql
-- Show all indexes on audit_logs
SHOW INDEX FROM audit_logs;

-- Check index usage (after queries)
SELECT * FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'shs' AND TABLE_NAME = 'audit_logs';
```

---

## 📚 Documentation Files

- **AUDIT_MANAGEMENT_PLAN.md** - Strategic plan for comprehensive audit coverage
- **AUDIT_SYSTEM_IMPLEMENTATION.md** - Core implementation details
- **Phase 1: Critical Audit Implementation Guide.md** - This file

---

## 🎯 Phase 1 Success Criteria

✅ **Completed:**
- [x] Database schema expanded with 34 action types
- [x] 7 new audit logging functions implemented
- [x] Role change tracking integrated in adminUserController.js
- [x] Migration script created
- [x] Views for critical operations created
- [x] Error tracking functions available

⏳ **In Progress:**
- [ ] Account lockout logging integration
- [ ] Session timeout logging integration
- [ ] Error handler integration
- [ ] Unit tests for new functions

🔄 **Next Phase (Phase 2):**
- [ ] Document download tracking
- [ ] Carousel CRUD logging
- [ ] Org chart logging
- [ ] Status change tracking

---

## 📞 Support Notes

### Common Issues

**Q: I'm getting "Unknown column" errors when running migration**
- A: One or more fields may already exist. You can safely ignore ALTER TABLE... errors for existing columns.

**Q: Why do some fields have DEFAULT values?**
- A: These are backward-compatible enhancements. Existing code continues to work; new code can provide values.

**Q: What's the difference between logUpdate and logRoleChange?**
- A: `logUpdate` is generic (logs any field change), `logRoleChange` is specific to role changes and appears separately in audit logs for emphasis.

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| Apr 16, 2026 | 1.0 | Phase 1 Implementation - Critical audit actions |
| (Pending) | 1.1 | Account lockout and session timeout integration |
| (Pending) | 1.2 | Error tracking and backup logging integration |

---

**Status:** ✅ Phase 1 Core Implementation Complete | ⏳ Awaiting Integration Testing

