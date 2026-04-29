# PRODUCTION DEPLOYMENT - VISUAL EXECUTION GUIDE

**Estimated Time**: 2-3 hours (complete cleanup and deployment)

---

## PHASE-BY-PHASE EXECUTION PATH

```
START: Development System
   ↓
PHASE 1: Code Cleanup (30 min)
   ├─ Remove test files
   ├─ Remove debug scripts
   └─ Remove debug code
   ↓
PHASE 2: Configuration (20 min)
   ├─ Generate JWT_SECRET
   ├─ Update .env
   └─ Setup database user
   ↓
PHASE 3: Build & Verify (30 min)
   ├─ Frontend: npm run build
   ├─ Backend: npm install --only=production
   └─ Test: npm start
   ↓
PHASE 4: Database Setup (20 min)
   ├─ Create backup
   ├─ Clean test data
   └─ Create indexes
   ↓
PHASE 5: Testing (40 min)
   ├─ API endpoint testing
   ├─ Frontend functionality
   ├─ Security verification
   └─ Performance check
   ↓
PHASE 6: Deployment (30 min)
   ├─ Commit changes
   ├─ Push to git
   └─ Deploy to server
   ↓
PHASE 7: Verification (20 min)
   ├─ Health checks
   ├─ Feature testing
   └─ Monitor logs
   ↓
END: Production System ✓
```

---

## FILES TO REMOVE - QUICK REFERENCE

### Backend Cleanup
```
Keep:                           Remove:
──────────────────────────────  ──────────────────────────────
✓ config/                       ✗ tests/ (all 8 files)
✓ controllers/                  ✗ scripts/test-*.js (15 files)
✓ database/                     ✗ recovery_debug.log
✓ middleware/                   ✗ backend/nul
✓ routes/
✓ services/
✓ utils/
✓ uploads/
✓ scripts/ (admin utils only)
✓ server.js
✓ package.json
✓ .env (with production values)
```

### Frontend Cleanup
```
Keep:                           Remove:
──────────────────────────────  ──────────────────────────────
✓ dist/                         ✗ setupTests.js
✓ src/                          ✗ __mocks__/ directory
✓ public/                       ✗ CreateFolderForm.jsx (?)
✓ package.json                  ✗ RequireHttps.jsx (?)
✓ index.html                    ✗ FileExplorer.jsx (?)
✓ vite.config.js

(? = Review for usage first)
```

---

## COMMAND EXECUTION ORDER

### Step 1: Generate Credentials
```bash
# Generate JWT_SECRET (copy the output)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a7f3k9d2x8c1v5m3n9b2q8e4r7t2y5u9i0o1p2s3d4f5g6h7j8k9l0

# Keep this value - you'll need it for .env
```

### Step 2: Update Environment
```bash
# Edit backend/.env with production values
# - JWT_SECRET = (paste generated value)
# - NODE_ENV = production
# - DB_HOST = production_server
# - DB_USER = limited_user
# - DB_PASS = strong_password
```

### Step 3: Frontend Build
```bash
cd cid-shs-portal/frontend
npm install
npm run lint
npm run build

# Verify dist/ folder created with assets/
ls -la dist/
```

### Step 4: Backend Verification
```bash
cd cid-shs-portal/backend
npm install --only=production
npm start

# Should see:
# Server running on port 5000
# Successfully connected to shs_production
```

### Step 5: Test Health Endpoint
```bash
curl http://localhost:5000/api/ping
# Expected: {"status":"ok"}
```

### Step 6: Database Setup
```bash
# Backup
mysqldump -u root -p shs > backup_shs_20260429.sql

# Create production user
# (Run SQL commands in MySQL client)
CREATE USER 'shs_prod_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON shs_production.* TO 'shs_prod_user'@'localhost';

# Create indexes
# (Run SQL commands in MySQL client)
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_issuances_student_id ON issuances(student_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at);
```

### Step 7: Run Test Suite
```bash
# Test critical endpoints
# POST /api/auth/login
# GET /api/issuances
# POST /api/upload
# GET /api/ping

# Test in browser:
# 1. Load frontend: http://localhost:3000 (after deploy)
# 2. Login with admin credentials
# 3. Create an issuance
# 4. Download a report
# 5. Check audit logs
```

---

## SECURITY HARDENING CHECKLIST

```
Priority Level: CRITICAL (Must Have)
├─ [ ] JWT_SECRET changed from "change-me"
├─ [ ] NODE_ENV=production
├─ [ ] DATABASE_PASSWORD is strong
├─ [ ] .env NOT in git repository
├─ [ ] CORS limited to production domain
└─ [ ] HTTPS/SSL configured

Priority Level: HIGH (Should Have)
├─ [ ] Database backup created
├─ [ ] Rate limiting enabled
├─ [ ] Helmet.js security headers active
├─ [ ] Input validation on all endpoints
└─ [ ] Error messages don't expose system details

Priority Level: MEDIUM (Good to Have)
├─ [ ] Audit logs configured as immutable
├─ [ ] Database connection pooling optimized
├─ [ ] Frontend build minified
└─ [ ] Logs rotating and archived
```

---

## MONITORING SETUP

### Real-Time Monitoring
```bash
# Terminal 1: Backend logs
tail -f /path/to/backend/logs/error.log

# Terminal 2: Database activity
mysql -u root -p -e "SHOW PROCESSLIST;" # Run every 10 sec

# Terminal 3: System resources
top -u node_app_user
```

### Automated Health Checks
```bash
# Add to crontab (every 5 minutes)
*/5 * * * * curl -f http://localhost:5000/api/ping || systemctl restart shs-backend
```

### Daily Backup
```bash
# Add to crontab (2 AM daily)
0 2 * * * mysqldump -u backup_user -p shs > /backups/shs_$(date +\%Y\%m\%d).sql
```

---

## TESTING WORKFLOW

### Unit Tests
```
✓ Skip unit tests in production (unnecessary)
✓ Run during development with: npm test
✓ Ensure all tests pass before commit
```

### Integration Tests
```
1. Login → Create Issuance → Download Report
2. File Upload → Verify Storage → Delete
3. API Error Cases → Verify Error Handling
4. Rate Limiting → Exceed Limit → Check Response
```

### Security Tests
```
1. SQL Injection → Try: ' OR '1'='1  (should fail)
2. XSS Attack → Try: <script>alert('test')</script> (should fail)
3. CSRF → Check token validation
4. Auth Bypass → Try accessing /admin without token (should fail)
```

### Performance Tests
```
1. Load test with 10 concurrent users
2. Measure response times
3. Monitor database queries
4. Check memory/CPU usage
```

---

## ROLLBACK PROCEDURE

### If Deployment Fails
```
Step 1: Stop the service
pm2 stop shs-backend

Step 2: Revert code changes
git revert HEAD

Step 3: Install dependencies
npm install

Step 4: Restore database backup
mysql -u root -p shs < backup_shs_20260429.sql

Step 5: Restart service
npm start

Step 6: Verify health
curl http://localhost:5000/api/ping
```

### If Only Frontend Breaks
```
Step 1: Restore previous build
git checkout HEAD~1 -- cid-shs-portal/frontend

Step 2: Rebuild
npm run build

Step 3: Re-deploy dist/
```

### If Only Backend Breaks
```
Step 1: Restore previous code
git checkout HEAD~1 -- cid-shs-portal/backend

Step 2: Install dependencies
npm install

Step 3: Restart service
npm start
```

---

## POST-DEPLOYMENT VALIDATION

### First Hour After Deploy
```
☐ Login functionality works
☐ API endpoints respond correctly
☐ File uploads work
☐ Database queries complete quickly
☐ No error messages in browser console
☐ No error messages in server logs
☐ HTTPS connection secure
```

### First 24 Hours After Deploy
```
☐ Monitor error logs (should be low)
☐ Monitor database performance
☐ Test user logins from different locations
☐ Verify email recovery works
☐ Check backup was created successfully
☐ Review audit logs for suspicious activity
```

### First Week After Deploy
```
☐ Continue error monitoring
☐ Collect user feedback
☐ Review performance metrics
☐ Check for any security warnings
☐ Verify backups running on schedule
☐ Document any issues encountered
```

---

## COMMON ISSUES - QUICK FIX GUIDE

| Issue | Symptom | Fix | Time |
|-------|---------|-----|------|
| JWT Error | "Invalid Token" | Restart server, users logout | 2 min |
| CORS Error | "Access Denied" | Add domain to FRONTEND_ORIGIN | 5 min |
| DB Connection | "Cannot Connect" | Verify host/user/password | 10 min |
| 404 Assets | Missing CSS/JS | Verify dist/ copied | 5 min |
| Upload Fails | File rejected | Check uploads/ permissions | 5 min |
| Slow Queries | Page loading slow | Create missing indexes | 10 min |
| Logout Error | Can't logout | Clear cookies/cache | 3 min |

---

## DEPLOYMENT CHECKLIST - PRINT & CHECK OFF

```
┌─────────────────────────────────────────────────────────┐
│  PRODUCTION DEPLOYMENT - FINAL CHECKLIST                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  CODE PREPARATION                                       │
│  ☐ All test files removed                              │
│  ☐ All debug scripts removed                           │
│  ☐ All console.log() debug statements removed          │
│  ☐ No hardcoded credentials in code                    │
│  ☐ ESLint passing (npm run lint)                       │
│                                                          │
│  ENVIRONMENT SETUP                                      │
│  ☐ JWT_SECRET generated (32+ chars)                    │
│  ☐ NODE_ENV=production                                 │
│  ☐ Database credentials configured                      │
│  ☐ .env NOT in git repository                          │
│  ☐ CORS domain configured                              │
│                                                          │
│  BUILD & VERIFICATION                                  │
│  ☐ Frontend build succeeds (npm run build)             │
│  ☐ dist/ folder created with assets                    │
│  ☐ Backend starts without errors                       │
│  ☐ Health endpoint responds (/api/ping)                │
│  ☐ Database connection works                           │
│                                                          │
│  TESTING COMPLETE                                       │
│  ☐ Login works                                         │
│  ☐ Create issuance works                               │
│  ☐ File upload works                                   │
│  ☐ Export/download works                               │
│  ☐ Audit logs recorded                                 │
│  ☐ No errors in console                                │
│  ☐ No errors in logs                                   │
│                                                          │
│  SECURITY VERIFIED                                      │
│  ☐ SSL/HTTPS enabled                                   │
│  ☐ Rate limiting active                                │
│  ☐ Input validation working                            │
│  ☐ SQL injection prevented                             │
│  ☐ XSS prevention enabled                              │
│                                                          │
│  DATABASE READY                                         │
│  ☐ Backup created and tested                           │
│  ☐ Indexes created                                     │
│  ☐ Test data removed                                   │
│  ☐ Production user created                             │
│  ☐ Permissions verified                                │
│                                                          │
│  DEPLOYMENT READY                                       │
│  ☐ Team trained and aware                              │
│  ☐ Rollback procedure documented                       │
│  ☐ Monitoring configured                               │
│  ☐ Backups automated                                   │
│  ☐ Emergency contacts listed                           │
│                                                          │
│                                                          │
│  FINAL SIGN-OFF                                         │
│  ☐ All items checked                                   │
│  ☐ Ready for production deployment                     │
│                                                          │
│                                                          │
│  Deployed by: ________________  Date: ______________   │
│  Approved by: ________________  Time: ______________   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ESTIMATED TIMELINE

```
Activity                    Time        Cumulative
────────────────────────────────────────────────────
Generate credentials        5 min       5 min
Update configuration       15 min      20 min
Frontend build & test      10 min      30 min
Backend verification       10 min      40 min
Database setup            20 min       60 min
Run tests                 30 min       90 min
Final review              10 min      100 min
Deploy                    20 min      120 min
Post-deploy verify        15 min      135 min
                                      ─────────
Total:                                135 min
                                      (~2.25 hours)
```

---

## SUCCESS INDICATORS ✓

### You Know It's Working When:

```
🟢 Green Indicators:
  ✓ curl /api/ping returns {"status":"ok"}
  ✓ Frontend loads and no console errors
  ✓ Login successful with admin credentials
  ✓ Can create/edit/delete issuances
  ✓ File uploads store correctly
  ✓ Audit logs record all actions
  ✓ Reports download without errors
  ✓ Performance is responsive (<2s pages)
  ✓ No errors in production logs
  ✓ Database queries complete quickly

🔴 Red Indicators (Problems):
  ✗ API endpoints return 500 errors
  ✗ Database connection fails
  ✗ CORS blocks frontend requests
  ✗ File uploads fail
  ✗ JWT authentication fails
  ✗ Pages load extremely slow
  ✗ Errors fill up log files
  ✗ Memory usage keeps growing
```

---

## QUICK REFERENCE COMMANDS

```bash
# Copy-paste these when ready to deploy

# 1. Backend startup
cd cid-shs-portal/backend && npm start

# 2. Frontend build
cd cid-shs-portal/frontend && npm run build

# 3. Health check
curl http://localhost:5000/api/ping

# 4. View logs
tail -f backend/logs/error.log

# 5. Database backup
mysqldump -u root -p shs > shs_backup_$(date +%Y%m%d_%H%M%S).sql

# 6. Commit deployment
git add -A && git commit -m "Production deployment" && git push origin main

# 7. PM2 management
pm2 start server.js --name "shs-backend"
pm2 stop shs-backend
pm2 restart shs-backend
pm2 logs shs-backend
```

---

## NEXT ACTIONS

### Right Now
1. ☐ Read PRODUCTION_DEPLOYMENT_GUIDE.md
2. ☐ Generate JWT_SECRET
3. ☐ Review .env template

### This Hour
4. ☐ Execute cleanup steps
5. ☐ Update configuration
6. ☐ Build frontend

### This Day
7. ☐ Run full test suite
8. ☐ Verify security
9. ☐ Create backups

### This Week
10. ☐ Deploy to staging
11. ☐ Final testing
12. ☐ Production deployment

---

**Print this page and check off each item as you go!**

---

**Document Version**: 1.0  
**Created**: April 29, 2026  
**Status**: Production Ready  
**Keep for reference during and after deployment**
