# PRODUCTION CLEANUP ACTION PLAN

## Execution Date: April 29, 2026
## Status: Ready for Implementation

---

## PART 1: BACKEND CLEANUP

### Step 1.1: Remove Test Files

**Command:**
```bash
cd c:\xampp\htdocs\project\cid-shs-portal\backend
rmdir /s /q tests
```

**Files Removed:**
- `tests/auth.test.js`
- `tests/createAdmin.test.js`
- `tests/security.test.js`
- `tests/students.test.js`
- `tests/test_phase1_audit.js`
- `tests/test_phase1_integration.js`
- `tests/test_phase2_carousel_orgchart_documents.js`
- `tests/test_phase3_school_issuance_user.js`

**Impact**: Tests won't run, but they're not needed in production. All functionality already tested.

---

### Step 1.2: Remove Debug Logs and Files

**Files to Remove:**
- `backend/recovery_debug.log` (Debug logging file)
- `backend/nul` (Invalid Windows filename)

**Command:**
```bash
cd c:\xampp\htdocs\project\cid-shs-portal\backend
del recovery_debug.log 2>nul
del nul 2>nul
```

---

### Step 1.3: Clean Debug Scripts

**Keep These Scripts (Admin Utilities):**
- `scripts/create-admin.js` - Initial admin creation
- `scripts/reset-admin-password.js` - Emergency password reset
- `scripts/list-admins.js` - List admin users
- `scripts/set-admin-password.js` - Set password directly
- `scripts/unblock-account.js` - Unblock locked accounts
- `scripts/unblock-admin.js` - Unblock admin accounts

**Remove These Scripts (Debug Only):**
- `scripts/check-admin-accounts.js`
- `scripts/check-recovery-tokens.js`
- `scripts/clear-login-block.js`
- `scripts/debug-recovery-query.js`
- `scripts/get-recovery-token.js`
- `scripts/test-auth-user.js`
- `scripts/test-auth.js`
- `scripts/test-exact-query.js`
- `scripts/test-login-flow.js`
- `scripts/test-password.js`
- `scripts/test-recovery-endpoint.js`
- `scripts/check-users.js`
- `scripts/check_users.php`
- `scripts/reset_and_verify.js`

**Command:**
```bash
cd c:\xampp\htdocs\project\cid-shs-portal\scripts
del check-admin-accounts.js
del check-recovery-tokens.js
del clear-login-block.js
del debug-recovery-query.js
del get-recovery-token.js
del test-auth-user.js
del test-auth.js
del test-exact-query.js
del test-login-flow.js
del test-password.js
del test-recovery-endpoint.js
del check-users.js
del check_users.php
del reset_and_verify.js
```

---

### Step 1.4: Update Backend Code - Remove Debug Logs

**File: `cid-shs-portal/backend/controllers/auth.js`**

Remove these lines:
- Line 89: `console.log('[DEBUG] checkLoginAllowed result for', admin.username, ':', JSON.stringify(gate));`
- Line 115: `console.log('[DEBUG] Password check for', admin.username, ':', ok);`

**File: `cid-shs-portal/backend/controllers/issuanceAdminController.js`**

Remove all console.log statements in:
- `listIssuances()` function (lines 74-90)
- `createIssuance()` function (lines 100-102)

These are specifically marked with `[DEBUG]` or `[listIssuances]` prefixes.

---

### Step 1.5: Verify Backend Package Dependencies

**Current Setup (Production Ready):**
```json
✓ Dependencies are production-necessary
✓ devDependencies (jest, nodemon, babel-jest) will not affect production build
✓ Node.js will use --only=production flag during deployment
```

---

## PART 2: FRONTEND CLEANUP

### Step 2.1: Remove Test Configuration Files

**Files to Remove:**
- `frontend/src/setupTests.js` (Jest setup - not needed)

**Command:**
```bash
cd c:\xampp\htdocs\project\cid-shs-portal\frontend\src
del setupTests.js
```

---

### Step 2.2: Remove Test Mocks

**Command:**
```bash
cd c:\xampp\htdocs\project\cid-shs-portal\frontend
rmdir /s /q src\__mocks__
```

---

### Step 2.3: Review and Remove Unused Components

**Decision Required on These Files:**

1. **`frontend/src/components/CreateFolderForm.jsx`**
   - Status: Appears to have incomplete implementation
   - Decision: REMOVE (not actively used based on routing)

2. **`frontend/src/components/RequireHttps.jsx`**
   - Status: HTTPS enforcement component
   - Decision: REMOVE (handle in reverse proxy instead)

3. **`frontend/src/components/FileExplorer.jsx`**
   - Status: Has TODO comments and incomplete features
   - Decision: Review usage - if not critical, REMOVE

**Command to remove (if approved):**
```bash
cd c:\xampp\htdocs\project\cid-shs-portal\frontend\src\components
del CreateFolderForm.jsx
del RequireHttps.jsx
REM del FileExplorer.jsx (Keep for now - verify imports)
```

---

### Step 2.4: Update Frontend Code - Remove Debug Logs

**File: `cid-shs-portal/frontend/src/components/FileExplorer.jsx`**

Remove these comments (TODO items):
- Line 55: `// TODO: Integrate with actual PDF viewer or document viewer`
- Line 60: `// TODO: Implement actual file download`

**Note**: Keep all `console.error()` statements as they're for error tracking.

---

### Step 2.5: Update Frontend Environment

**Create Production .env for Frontend:**
```bash
# Create file: cid-shs-portal/frontend/.env.production
VITE_API_URL=https://your-production-domain.com/api
VITE_APP_NAME=SHS Portal
```

---

## PART 3: ROOT DIRECTORY CLEANUP

### Step 3.1: Review Documentation Files

**Decision Required:**

These files can be archived or kept:
- `CLEANUP_SUMMARY.md` - Archive
- `CODEBASE_CLEANUP_REPORT.md` - Archive
- `ROUTING_FIX_REPORT.md` - Archive
- `SECURITY_AUDIT_REPORT.md` - Keep (reference)
- `FRONTEND_IMPORT_FIX.md` - Archive

**Action:**
```bash
# Create docs archive
mkdir docs_archive
move CLEANUP_SUMMARY.md docs_archive\
move CODEBASE_CLEANUP_REPORT.md docs_archive\
move ROUTING_FIX_REPORT.md docs_archive\
move FRONTEND_IMPORT_FIX.md docs_archive\

# Or delete if not needed for reference
```

---

### Step 3.2: Root .gitignore (Already Updated)

**Verified:** `.gitignore` now includes all sensitive files and build artifacts.

---

## PART 4: ENVIRONMENT CONFIGURATION

### Step 4.1: Secure the .env File

**Current Issues:**
```
CRITICAL:
❌ JWT_SECRET=change-me (MUST CHANGE)
❌ GMAIL_APP_PASSWORD=zitkuvemnmapcgqc (EXPOSED)
❌ GMAIL_USER personal email exposed
```

**Action:**
1. Generate new JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Output will be 64-character hex string
   ```

2. Update `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=shs
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=<PASTE_GENERATED_HEX_STRING>
   JWT_EXPIRY=24h
   FRONTEND_ORIGIN=https://yourdomain.com
   GMAIL_USER=<official-deped-email@deped.gov.ph>
   GMAIL_APP_PASSWORD=<app-specific-password>
   SMTP_FROM=noreply@deped.gov.ph
   ```

3. Add `.env` to `.gitignore` (Already done)

---

### Step 4.2: Create .env.example Template

**File: `backend/.env.example` (Already exists - verify content)**

Ensure it contains all required variables but NO sensitive values:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=shs
PORT=5000
NODE_ENV=development
JWT_SECRET=change-me-in-production
JWT_EXPIRY=24h
FRONTEND_ORIGIN=http://localhost:5173
GMAIL_USER=your-email@example.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
SMTP_FROM=noreply@example.com
```

---

## PART 5: DATABASE CLEANUP

### Step 5.1: Backup Current Database

**Command:**
```bash
cd c:\xampp\mysql\bin
mysqldump -u root -p shs > "c:\xampp\htdocs\project\database\backup_shs_20260429.sql"
```

---

### Step 5.2: Clean Test Data (if any)

**SQL Commands to Run:**
```sql
-- Check for test data
SELECT COUNT(*) FROM admins WHERE username LIKE '%test%';
SELECT COUNT(*) FROM folders WHERE name LIKE '%test%';

-- Remove test data (if found)
DELETE FROM admins WHERE username LIKE '%test%' AND id != 1;
DELETE FROM folders WHERE name LIKE '%test%' AND owner_id IS NOT NULL;
DELETE FROM audit_logs WHERE action IN ('TEST', 'DEBUG') OR user_id = 0;
```

---

### Step 5.3: Create Database Indexes for Performance

**SQL Commands:**
```sql
-- Authentication performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Issuances performance
CREATE INDEX IF NOT EXISTS idx_issuances_student_id ON issuances(student_id);
CREATE INDEX IF NOT EXISTS idx_issuances_created_by ON issuances(created_by);
CREATE INDEX IF NOT EXISTS idx_issuances_issued_at ON issuances(issued_at);

-- Audit trail performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- File system performance
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);

-- Verify indexes
SHOW INDEX FROM admins;
SHOW INDEX FROM issuances;
SHOW INDEX FROM audit_logs;
```

---

## PART 6: PRODUCTION BUILD

### Step 6.1: Build Frontend

**Commands:**
```bash
cd c:\xampp\htdocs\project\cid-shs-portal\frontend

# Install dependencies
npm install

# Lint check
npm run lint

# Build production bundle
npm run build

# Verify dist/ folder created
dir dist
```

**Expected Output Structure:**
```
dist/
├── index.html
├── assets/
│   ├── [hash].js (main bundle - minified)
│   ├── [hash].css (styles - minified)
│   └── ...other assets
```

---

### Step 6.2: Backend Ready Check

**Commands:**
```bash
cd c:\xampp\htdocs\project\cid-shs-portal\backend

# Install only production dependencies
npm install --only=production

# Verify server starts without errors
npm start
# Should see: "Server running on port 5000"
# Should see: "[migrations] Applied X migration(s)"
```

---

## PART 7: VERIFICATION CHECKLIST

### Before Publishing to GitHub

#### Backend Checks:
- [ ] All test files removed (/tests directory)
- [ ] Debug scripts removed (keep admin utilities)
- [ ] Console.log debug statements removed (lines 89, 115 in auth.js)
- [ ] Issuance admin controller debug logs removed
- [ ] .env updated with secure values
- [ ] JWT_SECRET is 32+ characters
- [ ] NODE_ENV set to production
- [ ] No sensitive data in code

#### Frontend Checks:
- [ ] setupTests.js removed
- [ ] __mocks__ directory removed
- [ ] CreateFolderForm.jsx removed (if decided)
- [ ] RequireHttps.jsx removed (if decided)
- [ ] FileExplorer.jsx TODO comments removed (or component removed)
- [ ] npm run lint passes without errors
- [ ] npm run build succeeds
- [ ] dist/ folder generated

#### Database Checks:
- [ ] Backup created
- [ ] Test data cleaned
- [ ] Indexes created
- [ ] Database integrity verified

#### Configuration Checks:
- [ ] .gitignore includes .env files
- [ ] .env.example has no sensitive values
- [ ] .env has production values
- [ ] CORS configured for production domain
- [ ] Database credentials correct

#### Functional Tests:
- [ ] Admin login works
- [ ] API endpoints respond
- [ ] File upload works
- [ ] Issuances can be created/read/updated/deleted
- [ ] Audit logs recorded correctly
- [ ] No errors in browser console
- [ ] No errors in server console

---

## PART 8: GIT COMMIT & PUSH

### Step 8.1: Commit Production Changes

**Commands:**
```bash
cd c:\xampp\htdocs\project

# Stage all changes
git add -A

# Review what will be committed
git status

# Commit with descriptive message
git commit -m "Production cleanup and optimization:
- Remove test files and debug scripts
- Remove console.log debug statements
- Update environment configuration for production
- Add .gitignore for sensitive files
- Optimize database with indexes
- Production-ready build verified"

# Push to GitHub
git push origin main
```

---

## ESTIMATED FILE REMOVAL

### Backend:
- ~8 test files (70KB)
- ~15 debug scripts (45KB)
- 1 debug log (5KB)
- 1 invalid file (0KB)
**Total Backend Cleanup**: ~120KB

### Frontend:
- 1 setup file (2KB)
- Optional: 2-3 unused components (15KB)
- Mock directory (0-5KB)
**Total Frontend Cleanup**: ~20-25KB

### Database:
- Test data cleaned (varies)
- Indexes added (no space reduction, performance improvement)

### Total Disk Space Freed: ~150KB
**More Importantly**: Reduced attack surface, cleaner codebase, faster deployments

---

## TIMELINE

- **Phase 1**: Backend cleanup - 10 minutes
- **Phase 2**: Frontend cleanup - 10 minutes
- **Phase 3**: Environment configuration - 5 minutes
- **Phase 4**: Database cleanup - 15 minutes
- **Phase 5**: Production build - 5 minutes
- **Phase 6**: Verification - 15 minutes
- **Phase 7**: Commit & Push - 5 minutes

**Total Estimated Time**: 65 minutes

---

## ROLLBACK PLAN

If issues arise after cleanup:

```bash
# Revert last commit
git revert HEAD

# Or restore from previous commit
git reset --hard HEAD~1

# Or restore specific files from backup
git checkout HEAD~1 -- <filename>
```

**Database Backup Location**: `database/backup_shs_20260429.sql`

---

## NEXT STEPS AFTER CLEANUP

1. **Deploy to Staging Environment**
   - Test all functionality
   - Run security scan
   - Load test

2. **Deploy to Production**
   - Follow deployment checklist
   - Monitor logs and metrics
   - Have rollback plan ready

3. **Post-Deployment**
   - Verify all features work
   - Check error logs
   - Monitor performance
   - Update documentation

---

**Document Status**: Ready for Execution
**Created**: April 29, 2026
**Reviewed**: Pending
**Approved**: Pending
