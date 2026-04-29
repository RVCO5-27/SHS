# PRODUCTION DEPLOYMENT VERIFICATION & TESTING CHECKLIST

## Pre-Deployment Testing Suite
**Date**: April 29, 2026
**System**: SHS Portal (React + Express + MySQL)
**Target Environment**: Production

---

## SECTION 1: CODE QUALITY & CLEANUP VERIFICATION

### 1.1 Backend Code Review

#### Test Files Removal
- [ ] `/backend/tests/` directory removed or empty
- [ ] No `*.test.js` files in `/backend`
- [ ] `jest` and `supertest` not imported in production code

#### Debug Logs Removal
- [ ] `auth.js` lines 89, 115 cleaned (no `console.log('[DEBUG]')`)
- [ ] `issuanceAdminController.js` debug logs removed (lines 74-102)
- [ ] `folderAdminController.js` audit errors kept (console.error for failures)
- [ ] `recovery_debug.log` file removed
- [ ] `backend/nul` invalid file removed

#### Debug Scripts Removal
- [ ] `scripts/test-*.js` files removed (all 8 test scripts)
- [ ] `scripts/check-*.js` files removed
- [ ] `scripts/debug-*.js` files removed
- [ ] `scripts/get-recovery-token.js` removed
- [ ] Keep: `scripts/create-admin.js`, `scripts/reset-admin-password.js`, etc. (admin utilities)

#### Code Quality
- [ ] No `console.log()` for debugging (only errors/warnings)
- [ ] No `debugger;` statements
- [ ] No TODO comments in production code (or all completed)
- [ ] Error messages don't expose system details
- [ ] All routes validated with input sanitization

---

### 1.2 Frontend Code Review

#### Test Files Removal
- [ ] `setupTests.js` removed from `/src`
- [ ] `__mocks__/` directory removed
- [ ] No `*.test.js` files in frontend (if any exist)

#### Debug Code Removal
- [ ] `FileExplorer.jsx` TODO comments removed (lines 55, 60)
- [ ] `CreateFolderForm.jsx` component status checked (remove if unused)
- [ ] `RequireHttps.jsx` component status checked (remove if not used)
- [ ] All `console.log()` statements removed (keep `console.error` for error tracking)
- [ ] No `debugger;` statements

#### Unused Components
- [ ] Review `Dashboard.jsx` (if replaced by `AdminDashboard.jsx`)
- [ ] Review `Users.jsx` (if implementation incomplete)
- [ ] Verify deleted components not imported anywhere
- [ ] All imports resolved (no "module not found" errors)

#### Code Quality
- [ ] ESLint passing: `npm run lint` returns no errors
- [ ] No unused variables
- [ ] No unused imports
- [ ] API calls use production URL (in production build)

---

## SECTION 2: ENVIRONMENT CONFIGURATION VERIFICATION

### 2.1 Backend Environment (.env)

#### Security Checks
- [ ] JWT_SECRET is 32+ characters (not "change-me")
- [ ] JWT_SECRET is cryptographically generated (hex string)
- [ ] NODE_ENV=production (not development)
- [ ] Database password is strong (12+ mixed characters)
- [ ] No hardcoded credentials in source code

#### CORS Configuration
- [ ] FRONTEND_ORIGIN specifies exact domain(s) only
- [ ] FRONTEND_ORIGIN does NOT contain wildcards
- [ ] FRONTEND_ORIGIN matches where frontend is deployed

#### Database Configuration
- [ ] DB_HOST points to production database server
- [ ] DB_USER is limited-permissions user (not root)
- [ ] DB_PASS is correct for production user
- [ ] DB_NAME is production database name

#### Email Configuration
- [ ] GMAIL_USER is valid official DepEd email or SMTP configured
- [ ] GMAIL_APP_PASSWORD is app-specific password (if using Gmail)
- [ ] SMTP_FROM is configured
- [ ] Email recovery tested (password reset flow)

#### File Storage
- [ ] `uploads/` directory exists and is writable
- [ ] File upload size limit configured (500MB in code)
- [ ] Uploads path is absolute and secure

#### Logging
- [ ] Log level set to 'warn' or 'error' (not 'debug')
- [ ] Log files have write permissions
- [ ] Log directory exists and is writable

---

### 2.2 Frontend Environment

#### .env.production Verification
- [ ] VITE_API_URL points to production backend API
- [ ] No localhost URLs in production env
- [ ] All environment variables used in code have values

#### Build Configuration
- [ ] vite.config.js production settings reviewed
- [ ] Output directory is `dist/`
- [ ] Source maps not generated for production (security)
- [ ] Build output minified and optimized

---

### 2.3 .gitignore Verification

#### Critical Protections
- [ ] `.env` entry present (prevent .env from being committed)
- [ ] `.env.local`, `.env.*.local` entries present
- [ ] `node_modules/` entry present
- [ ] `dist/` entry present
- [ ] `*.log` entries present
- [ ] `.vscode/`, `.idea/` entries present (IDE config)

#### Verify .env Not Tracked
```bash
git status | grep .env  # Should return NOTHING
```
- [ ] .env file not shown in `git status`

---

## SECTION 3: FRONTEND BUILD VERIFICATION

### 3.1 Production Build

#### Build Process
- [ ] `npm run build` succeeds without errors
- [ ] `dist/` directory created
- [ ] `dist/index.html` exists and is valid HTML
- [ ] `dist/assets/` contains JavaScript and CSS files
- [ ] All assets have content hash in filename

#### Build Output
- [ ] JavaScript bundle is minified
- [ ] CSS bundle is minified
- [ ] No source maps in production build
- [ ] Bundle size is reasonable (<2MB for main JS)

#### Testing Build
- [ ] `npm run preview` serves build successfully
- [ ] Application loads in browser without errors
- [ ] No 404 errors for assets
- [ ] Console shows no JavaScript errors
- [ ] All pages load and display correctly

---

### 3.2 Application Functionality in Built Version

#### Navigation
- [ ] Home page loads
- [ ] All links work
- [ ] Routing works correctly
- [ ] Back/forward buttons work

#### Authentication
- [ ] Login page loads
- [ ] Admin can log in with valid credentials
- [ ] Login error displayed for invalid credentials
- [ ] JWT token stored in browser storage
- [ ] Logout clears token

#### Main Features
- [ ] Issuances page loads and displays data
- [ ] Can create new issuance
- [ ] Can edit existing issuance
- [ ] Can delete issuance
- [ ] File upload works
- [ ] Reports generate and download

#### Data Display
- [ ] Tables display data correctly
- [ ] Pagination works (if implemented)
- [ ] Filtering works (if implemented)
- [ ] Sorting works (if implemented)
- [ ] No console errors while using app

---

## SECTION 4: DATABASE VERIFICATION

### 4.1 Data Integrity

#### Test Data Cleanup
- [ ] No test records in `admins` table
- [ ] No test records in `issuances` table
- [ ] No test records in `folders` table
- [ ] Audit logs contain only legitimate operations
- [ ] Optional: Archive old data if table is large

#### Data Consistency
- [ ] No orphaned records (files with deleted folders, etc.)
- [ ] All foreign keys point to existing records
- [ ] Admin user can perform CRUD on issuances
- [ ] Timestamps are reasonable

#### Required Records
- [ ] At least one SuperAdmin user exists
- [ ] At least one active Admin user exists
- [ ] Essential categories exist
- [ ] Essential schools exist

---

### 4.2 Database Performance

#### Indexes
- [ ] Indexes exist on frequently searched columns:
  - [ ] `admins.username`
  - [ ] `admins.email`
  - [ ] `issuances.student_id`
  - [ ] `issuances.created_by`
  - [ ] `audit_logs.created_at`
  - [ ] `folders.parent_id`

#### Query Performance
- [ ] List issuances query completes in <1 second
- [ ] Login query completes in <500ms
- [ ] Search queries complete in <2 seconds
- [ ] No full table scans in slow queries

#### Database Optimization
- [ ] `ANALYZE TABLE` run on all main tables
- [ ] `OPTIMIZE TABLE` run on all main tables
- [ ] `SHOW PROCESSLIST` shows no long-running queries
- [ ] Backup taken and verified

---

### 4.3 Database Security

#### User Permissions
- [ ] Production database user created
- [ ] User has minimal required permissions (SELECT, INSERT, UPDATE, DELETE)
- [ ] User does NOT have super admin privileges
- [ ] Verify with: `SHOW GRANTS FOR 'user'@'host';`

#### Root Security
- [ ] Root user has strong password (not default)
- [ ] Remote root access disabled
- [ ] Anonymous users removed
- [ ] Old test users removed

---

## SECTION 5: BACKEND API VERIFICATION

### 5.1 API Endpoint Testing

#### Health & Status
- [ ] GET `/api/ping` returns `{"status":"ok"}`
- [ ] Response time < 100ms
- [ ] Works from production URL

#### Authentication Routes
- [ ] POST `/api/auth/login` accepts valid credentials
- [ ] POST `/api/auth/login` returns JWT token
- [ ] Invalid credentials return 401 error
- [ ] POST `/api/auth/logout` clears session
- [ ] GET `/api/auth/profile` requires valid token
- [ ] GET `/api/auth/profile` returns user data
- [ ] PUT `/api/auth/profile` updates profile correctly

#### Issuances Routes
- [ ] GET `/api/issuances` returns paginated list
- [ ] GET `/api/issuances/:id` returns specific issuance
- [ ] POST `/api/issuances` creates new issuance
- [ ] PUT `/api/issuances/:id` updates issuance
- [ ] DELETE `/api/issuances/:id` deletes issuance
- [ ] Missing ID returns 404 error

#### File Upload Routes
- [ ] POST `/api/upload` accepts file upload
- [ ] Large files (within limit) upload successfully
- [ ] Invalid file types rejected
- [ ] Files stored in secure location

#### Admin Routes (if applicable)
- [ ] Only SuperAdmin can access admin endpoints
- [ ] Regular Admin access denied to admin routes
- [ ] Unauthenticated access returns 401 error

---

### 5.2 API Response Verification

#### Response Format
- [ ] All responses have proper HTTP status codes
- [ ] Error responses include error message (not system details)
- [ ] Success responses include data and metadata
- [ ] JSON is properly formatted and valid

#### Status Codes
- [ ] 200 OK for successful GET requests
- [ ] 201 Created for successful POST requests
- [ ] 204 No Content for successful DELETE requests
- [ ] 400 Bad Request for invalid input
- [ ] 401 Unauthorized for missing/invalid tokens
- [ ] 403 Forbidden for insufficient permissions
- [ ] 404 Not Found for missing resources
- [ ] 500 Internal Server Error for unexpected errors (NOT exposed)

#### Error Handling
- [ ] No stack traces exposed to client
- [ ] No SQL queries exposed to client
- [ ] Error messages are user-friendly
- [ ] Errors logged on server

---

### 5.3 Security Verification

#### CORS Headers
- [ ] Correct `Access-Control-Allow-Origin` header set
- [ ] CORS configured only for production domain
- [ ] Credentials allowed: `Access-Control-Allow-Credentials: true`

#### Security Headers (Helmet.js)
- [ ] `X-Frame-Options: DENY` (prevent clickjacking)
- [ ] `X-Content-Type-Options: nosniff` (prevent MIME type sniffing)
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Strict-Transport-Security` present (if HTTPS)

#### Rate Limiting
- [ ] Rate limit applied to login endpoint
- [ ] Rate limit applied to file upload
- [ ] Exceeding limit returns 429 error
- [ ] Limits are reasonable (not too strict)

#### Input Validation
- [ ] Empty fields rejected appropriately
- [ ] Long strings truncated or rejected
- [ ] Special characters sanitized
- [ ] SQL injection attempts prevented
- [ ] XSS attempts prevented

#### JWT Security
- [ ] Token includes necessary claims (user_id, role)
- [ ] Token expiry enforced
- [ ] Expired token returns 401 error
- [ ] Token signature verified
- [ ] Refresh token mechanism (if implemented) works

---

## SECTION 6: FRONTEND-BACKEND INTEGRATION

### 6.1 Communication Tests

#### API Connectivity
- [ ] Frontend can reach backend at configured URL
- [ ] CORS allows frontend domain
- [ ] Response times are reasonable (<2s)
- [ ] Network errors handled gracefully

#### Data Flow
- [ ] Login: credentials sent, token received and stored
- [ ] Create issuance: form data sent, ID returned
- [ ] List issuances: pagination works, data displays
- [ ] Update issuance: changes saved and reflected
- [ ] Delete issuance: item removed and list updated

#### Error Handling
- [ ] Network errors show user-friendly message
- [ ] API errors (4xx, 5xx) handled appropriately
- [ ] Validation errors displayed to user
- [ ] Timeout errors display retry option

---

### 6.2 Session Management

#### Token Storage
- [ ] JWT token stored in localStorage or sessionStorage
- [ ] Token sent in Authorization header on all requests
- [ ] Token cleared on logout
- [ ] Token cleared on expiry (refresh flow or new login)

#### Authentication Flow
- [ ] Unauthenticated users cannot access protected routes
- [ ] Protected routes redirect to login
- [ ] Login successful with valid credentials
- [ ] Session persists across page refresh (if token stored)
- [ ] Logout clears session and redirects

#### Role-Based Access
- [ ] Admin routes accessible only to Admin/SuperAdmin
- [ ] SuperAdmin routes accessible only to SuperAdmin
- [ ] Regular users cannot access admin features
- [ ] Access denied returns appropriate error

---

## SECTION 7: FULL END-TO-END WORKFLOW TESTING

### 7.1 Complete Admin Workflow

#### Test Scenario: Create and Issue Certificate
1. [ ] Open app in browser
2. [ ] Navigate to login page
3. [ ] Enter admin credentials
4. [ ] Successfully login and redirect to dashboard
5. [ ] Navigate to Issuances page
6. [ ] Click "Create Issuance"
7. [ ] Fill in form (student data, certificate type, etc.)
8. [ ] Upload supporting files
9. [ ] Click Submit
10. [ ] Issuance created and appears in list
11. [ ] View issuance details
12. [ ] Edit issuance
13. [ ] Generate/export certificate (if feature exists)
14. [ ] Download certificate or report
15. [ ] Logout successfully

#### Test Scenario: Audit Trail
1. [ ] Perform admin actions (create, edit, delete)
2. [ ] Check audit logs endpoint
3. [ ] Verify all actions logged with:
    - [ ] User ID
    - [ ] Action type
    - [ ] Timestamp
    - [ ] Data changed (old vs new)
4. [ ] Audit logs are immutable (cannot be edited)

---

### 7.2 Error Scenario Testing

#### Test: Invalid Login
1. [ ] Enter wrong username
2. [ ] Error message displayed ("Invalid credentials")
3. [ ] No token returned
4. [ ] Can retry login

#### Test: Session Timeout
1. [ ] Wait for token expiry (if configured)
2. [ ] Try to access protected resource
3. [ ] Redirected to login
4. [ ] Clear message about expired session

#### Test: Upload Large File
1. [ ] Try to upload file >500MB
2. [ ] Upload rejected with error
3. [ ] User can select smaller file

#### Test: Database Connection Loss
1. [ ] Stop database server
2. [ ] Try to login
3. [ ] Error message displayed (not stack trace)
4. [ ] Error logged on server

---

## SECTION 8: PERFORMANCE & LOAD TESTING

### 8.1 Response Times

#### Backend Endpoints
- [ ] GET /api/ping: < 100ms
- [ ] GET /api/issuances: < 2s (with typical data size)
- [ ] POST /api/auth/login: < 500ms
- [ ] POST /api/upload: varies with file size

#### Frontend Performance
- [ ] Page load: < 3s
- [ ] Navigation between pages: < 1s
- [ ] Table rendering (100+ rows): < 500ms
- [ ] Search/filter: < 1s

### 8.2 Concurrent User Testing

#### Under Load
- [ ] 10 simultaneous users: application remains stable
- [ ] Database connections managed properly
- [ ] No timeouts or connection errors
- [ ] Response times degrade gracefully

---

## SECTION 9: SECURITY AUDIT

### 9.1 Credential Security
- [ ] No passwords in code
- [ ] No API keys in code
- [ ] No database credentials in code
- [ ] .env file ignored by git
- [ ] NEVER use default passwords

### 9.2 Access Control
- [ ] Only authenticated users can access API
- [ ] Role-based access enforced
- [ ] SuperAdmin-only routes protected
- [ ] Users cannot access other users' data

### 9.3 Data Protection
- [ ] Sensitive data encrypted (passwords use bcrypt)
- [ ] Audit logs immutable
- [ ] File uploads scanned for viruses (if implemented)
- [ ] HTTPS enforced (in production)

### 9.4 Injection Prevention
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (input sanitization)
- [ ] CSRF tokens used (if implemented)
- [ ] Command injection prevented

---

## SECTION 10: DEPLOYMENT READINESS CHECKLIST

### Final Sign-Off

#### Code Quality
- [ ] All debug code removed
- [ ] All test files removed
- [ ] Linting passes
- [ ] No console warnings
- [ ] All functionality works

#### Configuration
- [ ] .env configured for production
- [ ] .env NOT in git
- [ ] Database user created with minimal permissions
- [ ] CORS configured correctly

#### Database
- [ ] Database prepared and optimized
- [ ] Backup created
- [ ] Indexes created
- [ ] No test data

#### Frontend Build
- [ ] Production build created
- [ ] Assets minified
- [ ] No source maps
- [ ] Build tested and verified

#### Security
- [ ] All vulnerabilities patched
- [ ] No hardcoded credentials
- [ ] Strong JWT secret
- [ ] Rate limiting enabled

#### Testing
- [ ] All endpoints tested
- [ ] All features tested
- [ ] Error handling tested
- [ ] Performance acceptable

#### Documentation
- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] Emergency contacts listed
- [ ] Monitoring configured

---

## TEST RESULTS SUMMARY

| Category | Status | Notes |
|----------|--------|-------|
| Code Cleanup | [ ] | |
| Environment Config | [ ] | |
| Frontend Build | [ ] | |
| API Endpoints | [ ] | |
| Database | [ ] | |
| Security | [ ] | |
| Performance | [ ] | |
| End-to-End | [ ] | |

**Overall Readiness**: [ ] READY FOR PRODUCTION

---

## Sign-Off

**Tested By**: ________________________  
**Date**: ________________________  
**Approved By**: ________________________  

**Issues Found**: (List any remaining issues)
1. 
2. 
3. 

**Deployment Date**: ________________________  
**Deployment Environment**: [ ] Staging [ ] Production

---

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Test user access
- [ ] Monitor database performance

### First Week
- [ ] Continue error monitoring
- [ ] Collect user feedback
- [ ] Monitor for security issues
- [ ] Check backup status

---

**Document Version**: 1.0  
**Created**: April 29, 2026  
**Status**: Ready for Use  
