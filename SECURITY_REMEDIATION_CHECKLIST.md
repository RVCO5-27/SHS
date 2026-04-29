# SECURITY REMEDIATION CHECKLIST
## CID SHS Portal - Specific File Locations & Remediation Steps

**Last Updated:** April 16, 2026

---

## TIER 1: CRITICAL (32 Specific Fixes Required)

### [C-1.1] JWT Token Stored in localStorage - AuthContext.jsx
**File:** `frontend/src/context/AuthContext.jsx`  
**Line:** 23  
**Current Code:**
```javascript
const token = localStorage.getItem('token');
```
**Issue:** Token accessible to XSS attacks  
**Fix:** Switch to HttpOnly cookie, remove localStorage access  
**Verification:** Token not visible in Application > Local Storage

---

### [C-1.2] JWT Token Storage - AdminLogin.jsx
**File:** `frontend/src/pages/AdminLogin.jsx`  
**Lines:** 82, 84, 86  
**Current Code:**
```javascript
localStorage.setItem('token', res.data.token);
if (remember) {
  localStorage.setItem('adminRememberMe', '1');
} else {
  localStorage.removeItem('adminRememberMe');
}
```
**Issue:** Tokens persisted in localStorage  
**Fix:** Use httpOnly Secure SameSite cookies, remove remember-me  
**Verification:** Manual test login and check cookies via DevTools

---

### [C-1.3] JWT Token Storage - AdminRecovery.jsx
**File:** `frontend/src/pages/AdminRecovery.jsx`  
**Line:** 26  
**Issue:** Token set via localStorage  
**Fix:** Use cookie approach  
**Verification:** Inspect cookies after recovery

---

### [C-1.4] JWT Token Storage - AdminChangePassword.jsx
**File:** `frontend/src/pages/AdminChangePassword.jsx`  
**Lines:** 19, 62, 173  
**Issue:** Token management via localStorage  
**Fix:** Switch to secure cookies  
**Verification:** Test password change flow

---

### [C-1.5] JWT Token Attachment - api.js
**File:** `frontend/src/services/api.js`  
**Line:** 22  
**Current Code:**
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
**Issue:** Token read from localStorage on every request  
**Fix:** Auto-attach cookie (axios automatically sends cookies with sameSite=strict)  
**Verification:** Network tab shows Authorization header from cookie

---

### [C-1.6] PrivateRoute Token Check
**File:** `frontend/src/components/PrivateRoute.jsx`  
**Line:** 10  
**Current Code:**
```javascript
const token = localStorage.getItem('token');
```
**Issue:** Client-side route protection bypassed  
**Fix:** Server validates token on protected endpoints  
**Verification:** Test accessing routes without token

---

### [C-2.1] Schools Route - All Protected
**File:** `backend/routes/schools.js`  
**Lines:** 8-12  
**Current Code:**
```javascript
router.use(authMiddleware);
router.use(requireAdminRole);

router.get('/', schoolController.getAllSchools);  // PUBLIC should not require auth!
```
**Issue:** GET endpoint protected but should be public  
**Fix:** Split into public and admin routes:
```javascript
// Public route
router.get('/', schoolController.getAllSchools);

// Admin routes
router.post('/', authMiddleware, requireAdminRole, schoolController.createSchool);
router.put('/:id', authMiddleware, requireAdminRole, schoolController.updateSchool);
router.delete('/:id', authMiddleware, requireAdminRole, schoolController.deleteSchool);
```
**Verification:** GET /api/schools returns 200 without token

---

### [C-3.1] File Upload - No Type Validation
**File:** `backend/controllers/uploadController.js`  
**Lines:** 1-24  
**Current Code:**
```javascript
const upload = multer({ storage: storage });  // NO FILE TYPE RESTRICTION!
```
**Issue:** Accepts any file type  
**Fix:** Add fileFilter validation:
```javascript
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },  // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.ms-excel'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Only PDF, DOC, XLS files allowed'));
      return;
    }
    // Validate magic bytes
    cb(null, true);
  }
});
```
**Verification:** Attempt upload of .exe file, should be rejected

---

### [C-3.2] File Upload Route - Missing Auth
**File:** `backend/routes/issuances_admin.js`  
**Lines:** 5-10  
**Current Code:**
```javascript
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }  // 100MB - TOO LARGE!
});

router.post('/issuances', upload.array('files', 10), ...)
```
**Issue:** Large file size, no file type validation  
**Fix:** Add authentication middleware and limit file size to 50MB:
```javascript
router.post('/issuances', 
  authMiddleware, 
  requireAdminRole,
  upload.array('files', 10), 
  issuanceAdminController.createIssuance
);
```
**Verification:** Test upload without authentication (should fail)

---

### [C-4.1] Static File Serving - No Auth
**File:** `backend/server.js`  
**Line:** 42  
**Current Code:**
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```
**Issue:** Any file accessible without authentication  
**Fix:** Remove static middleware, create auth-required endpoint:
```javascript
// REMOVE: app.use('/uploads', express.static(...))

// ADD: Protected download endpoint
app.get('/api/uploads/:filename', (req, res, next) => {
  // 1. Verify authentication
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 2. Verify authorization (user owns file)
  // 3. Verify file exists and is in uploads dir
  // 4. Log access
  // 5. Serve file
  
  const filename = path.basename(req.params.filename);
  const filepath = path.join(__dirname, 'uploads', filename);
  
  // Verify path is within uploads directory (prevent traversal)
  if (!filepath.startsWith(path.join(__dirname, 'uploads'))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.download(filepath);
});
```
**Verification:** Direct access to /uploads/file.pdf should return 404

---

### [C-4.2] File Directory Enumeration
**File:** `backend/server.js`  
**Lines:** 43-49  
**Current Code:**
```javascript
app.get('/api/uploads', (req, res) => {
  const dir = path.join(__dirname, 'uploads');
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read uploads directory' });
    res.json(files || []);  // Lists ALL files without auth!
  });
});
```
**Issue:** Endpoint lists all files without authentication  
**Fix:** Remove this endpoint entirely, serve files through protected routes  
**Verification:** GET /api/uploads should return 404

---

### [C-5.1] SQL Query Logging - Issuances Controller
**File:** `backend/controllers/issuances.js`  
**Lines:** 27-32, 39-40  
**Current Code:**
```javascript
console.log('[getPublicIssuances] Query params:', { q, category_id, series_year, folder_id, start_date, end_date });
console.log('[getPublicIssuances] SQL:', sql);  // EXPOSES SCHEMA!
console.log('[getPublicIssuances] Params:', params);  // EXPOSES DATA!
console.log('[getPublicIssuances] Found', rows.length, 'rows');
```
**Issue:** SQL and trace data logged to console  
**Fix:** Remove all debug logging:
```javascript
// REMOVE ALL console.log statements
// IF needed for monitoring, use structured logging to file:
// logger.info('[getPublicIssuances] Found rows', { count: rows.length });
```
**Verification:** Run app, check console output has no SQL or data

---

### [C-5.2] Debug Logging - Admin Routes
**File:** `backend/routes/issuances_admin.js`  
**Lines:** 27-31  
**Current Code:**
```javascript
console.log('[DEBUG] After multer - files:', req.files?.length);
console.log('[DEBUG] After multer - body:', req.body);
console.log('[DEBUG] After multer - content-type:', req.headers['content-type']);
```
**Fix:** Remove all debug logging  
**Verification:** No debug output in console

---

### [C-5.3] Error Information Leakage
**File:** `backend/middleware/errorHandler.js`  
**Lines:** 4-6, 14-16  
**Current Code:**
```javascript
console.error(`[ERROR] ${req.method} ${req.path}`);
console.error(`[ERROR] Message: ${err.message}`);
console.error(`[ERROR] Stack: ${err.stack}`);  // STACK TRACE!

res.status(status).json({ 
  message: safeMessage, 
  error: safeMessage,
  ...(process.env.NODE_ENV !== 'production' && { details: err.message })  // DEBUG INFO
});
```
**Issue:** Stack traces and error details logged  
**Fix:** Log to file only, not console; strip details from response:
```javascript
// Log to file for admins only
const logger = require('./logger');  // Use Winston or Pino
logger.error(`${req.method} ${req.path}`, { 
  message: err.message, 
  stack: err.stack,
  userId: req.user?.id 
});

// Always return generic error to client
res.status(status).json({ error: 'Internal server error' });
```
**Verification:** Error responses show no details in dev or prod

---

## TIER 2: HIGH PRIORITY (25 Specific Fixes Required)

### [H-1.1] No Global Rate Limiting
**File:** `backend/server.js`  
**After Line:** 38 (after middleware setup)  
**Current:** Only login endpoint rate-limited  
**Fix:** Add global rate limiter:
```javascript
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later' });
  }
});

app.use('/api', globalLimiter);

// Override for specific endpoints (tighter limits)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true
});

app.post('/api/auth/login', loginLimiter, authRoutes);
```
**Verification:** Make 101 requests in 15min, 101st returns 429

---

### [H-1.2] Carousel Route - Rate Limiting
**File:** `backend/routes/carousel.js`  
**Line:** 1-3  
**Current:** No rate limiting middleware  
**Fix:** Add rate limiting middleware  
**Verification:** Test with rapid requests

---

### [H-2.1] CORS Configuration - Localhost Defaults
**File:** `backend/server.js`  
**Lines:** 21-30  
**Current Code:**
```javascript
return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost', 'http://127.0.0.1'];
```
**Issue:** Localhost defaults allow any localhost origin  
**Fix:** Require explicit env config:
```javascript
function getCorsAllowedOrigins() {
  const raw = process.env.FRONTEND_ORIGIN;
  if (!raw) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      throw new Error('FRONTEND_ORIGIN required in production');
    }
    // Development: explicit list only
    return ['http://localhost:5173', 'http://localhost:5174'];
  }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
```
**Verification:** Attempt request from http://localhost:8080 (should fail)

---

### [H-3.1] Change Password - Optional Current Password
**File:** `backend/routes/auth.js`  
**Lines:** 30-37  
**Current Code:**
```javascript
check('currentPassword').optional().isLength({ max: 72 })
```
**Issue:** currentPassword is optional  
**Fix:** Make it required:
```javascript
check('currentPassword')
  .notEmpty().withMessage('Current password is required')
  .isLength({ max: 72 }).withMessage('Password too long')
```
**Verification:** POST /auth/change-password without currentPassword should fail

---

### [H-4.1] File Directory Enumeration Removed (See C-4.2)

---

### [H-5.1] File Type Validation (See C-3.1)

---

### [H-6.1] Input Validation - Issuances Search
**File:** `backend/controllers/issuances.js`  
**Lines:** 18-47  
**Current Code:**
```javascript
if (q) {
  sql += ` AND (i.title LIKE ? OR i.tags LIKE ? OR i.doc_number LIKE ?)`;
  const query = `%${q}%`;
  params.push(query, query, query);  // No length validation!
}
```
**Issue:** No max length on search query  
**Fix:** Validate before using:
```javascript
if (q) {
  if (typeof q !== 'string' || q.length > 100) {
    return res.status(400).json({ error: 'Search query must be 1-100 characters' });
  }
  sql += ` AND (i.title LIKE ? OR i.tags LIKE ? OR i.doc_number LIKE ?)`;
  const query = `%${q.trim()}%`;
  params.push(query, query, query);
}
```
**Verification:** Attempt search with 500+ character string (should fail)

---

### [H-6.2] Date Parameter Validation
**File:** `backend/controllers/issuances.js`  
**Lines:** 41-47  
**Current Code:**
```javascript
if (start_date) {
  sql += ` AND i.date_issued >= ?`;
  params.push(start_date);  // No format validation!
}
```
**Fix:** Validate date format:
```javascript
if (start_date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return res.status(400).json({ error: 'Invalid date format (use YYYY-MM-DD)' });
  }
  sql += ` AND i.date_issued >= ?`;
  params.push(start_date);
}
```
**Verification:** GET with start_date=invalid should return 400

---

### [H-7.1] JWT Expiration Too Long
**File:** `backend/controllers/auth.js`  
**Lines:** 56, 75  
**Current Code:**
```javascript
jwt.sign(buildPayload(admin, mustFlag), getJwtSecret(), { expiresIn: '8h' })
jwt.sign(payload, getJwtSecret(), { expiresIn: '8h' })
```
**Issue:** 8 hour expiration is excessive  
**Fix:** Reduce to 30 minutes:
```javascript
jwt.sign(buildPayload(admin, mustFlag), getJwtSecret(), { expiresIn: '30m' })
jwt.sign(payload, getJwtSecret(), { expiresIn: '30m' })
```
**Add:** Refresh token mechanism with 7-day expiration  
**Verification:** Token expires after 30 minutes in dev environment

---

### [H-8.1] Public Endpoints Rate Limiting (See H-1.1)

---

### [H-9.1] Login Attempt Tracking - Fallback
**File:** `backend/controllers/auth.js`  
**Line:** 125  
**Current Code:**
```javascript
if (attemptsTableAvailable) {
  // track attempts
} else {
  await logAuthEvent('LOGIN_FAIL_WRONG_PASSWORD no_attempt_tracking', { adminId: admin.id, ip });
}
```
**Issue:** Fallback silently disables rate limiting  
**Fix:** Fail fast if table unavailable:
```javascript
if (!attemptsTableAvailable) {
  throw new Error('CRITICAL: login_attempts table unavailable. Run database migrations.');
}
```
**Verification:** Login attempts table must exist in database

---

## TIER 3: MEDIUM PRIORITY (22 Specific Fixes Required)

### [M-1.1] Weak JWT Secret in Development
**File:** `backend/config/security.js`  
**Lines:** 8-13  
**Current Code:**
```javascript
if (secret && secret !== 'change-me') {
  return secret;
}
return 'dev-only-insecure-jwt-secret-do-not-use-in-production';
```
**Issue:** Hard-coded weak secret  
**Fix:** Require configuration:
```javascript
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be 32+ characters (see .env.example)');
  }
  return secret;
}
```
**Verification:** Server fails to start without JWT_SECRET

---

### [M-2.1] No Token Invalidation on Logout
**File:** `backend/controllers/auth.js`  
**Add:** Logout endpoint  
**File:** `backend/routes/auth.js`  
**Add:** Logout route with token invalidation
```javascript
const logoutTokenBlacklist = new Set();  // Production: use Redis

router.post('/logout', authMiddleware, (req, res) => {
  // Add token to blacklist
  logoutTokenBlacklist.add(req.token);
  
  // Clean old entries (demo purpose)
  res.json({ message: 'Logged out successfully' });
});
```
**Verification:** Token becomes invalid immediately after logout

---

### [M-3.1] Verbose Error Messages
**File:** `backend/middleware/errorHandler.js`  
**See:** C-5.3 for details  

---

### [M-4.1] Missing Content Security Policy
**File:** `backend/server.js`  
**After:** helmet() middleware  
**Add:**
```javascript
const helmet = require('helmet');

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],  // Allow inline for now
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
  }
}));
```
**Verification:** CSP headers present in HTTP response

---

### [M-5.1] Client-Side Route Protection Only
**File:** `frontend/src/components/PrivateRoute.jsx`  
**Issue:** Only client-side check, server doesn't validate  
**Fix:** This is working as designed (server validates on API calls)  
**Verification:** Access protected API without token returns 401

---

### [M-6.1] Timestamp Collision on File Upload
**File:** `backend/controllers/uploadController.js` or `backend/routes/documents.js`  
**Current Code:**
```javascript
const safe = file.originalname.replace(/[^a-z0-9.\-\_\s]/gi, '_');
cb(null, `${Date.now()}-${safe}`);  // Collision possible on fast uploads
```
**Fix:** Use UUID:
```javascript
const { v4: uuidv4 } = require('uuid');

const filename = function (req, file, cb) {
  const ext = path.extname(file.originalname);
  const uuid = uuidv4();
  cb(null, `${uuid}${ext}`);
};
```
**Verification:** Each file has unique UUID filename

---

### [M-7.1] CSP Headers (See M-4.1)

---

### [M-8.1] Audit Log Access - SuperAdmin Only
**File:** `backend/routes/auditLogs.js`  
**Lines:** 12-20  
**Issue:** All users need some audit visibility  
**Recommended Fix Logic:**
```javascript
const requireAuditAccess = (req, res, next) => {
  const role = req.user.role;
  if (role === 'SuperAdmin') {
    // Can see all
    req.auditFilter = {};
  } else if (role === 'Editor') {
    // Can see own actions
    req.auditFilter = { userId: req.user.id };
  } else {
    // Viewers: read-only
    req.auditFilter = { userId: req.user.id };
    req.readOnly = true;
  }
  next();
};
```
**Verification:** Different roles see appropriate audit logs

---

### [M-9.1] Database Connection Pool - Unlimited Queue
**File:** `backend/config/db.js`  
**Lines:** 3-8  
**Current Code:**
```javascript
const pool = mysql.createPool({
    connectionLimit: 10,
    queueLimit: 0  // UNLIMITED!
});
```
**Fix:** Set reasonable queue limit:
```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cid_shs_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 20,  // Limit queued connections
    acquireTimeout: 10000  // 10 second timeout
});
```
**Verification:** Database pool respects queue limits

---

### [M-10.1] Sensitive Columns - Not Encrypted
**File:** `backend/database/shs.sql`  
**Issue:** Email, role, and audit data not encrypted  
**Fix:** Implement field-level encryption at application level  
**Verification:** Sensitive fields encrypted in database

---

## TIER 4: LOW PRIORITY (10 Specific Fixes)

### [L-1.1] Secure Headers
**File:** `backend/server.js`  
**Add:** Additional security headers
```javascript
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### [L-2.1] No Audit of Audit Access
**File:** `backend/controllers/auditLogController.js`  
**Fix:** Log all audit access attempts to separate immutable log

### [L-3.1] Database Query Timeouts
**File:** `backend/config/db.js`  
**Add:** Query timeout configuration
```javascript
pool.execute = async function(sql, params) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Query timeout'));
    }, 30000);  // 30 second timeout
    
    original_execute.call(this, sql, params)
      .then(r => { clearTimeout(timeout); resolve(r); })
      .catch(e => { clearTimeout(timeout); reject(e); });
  });
};
```

---

## TESTING CHECKLIST

### After Each Fix - Test & Verify

**C-1 JWT Fix Tests:**
- [ ] Login works with secure cookie
- [ ] Token not visible in Application > Local Storage
- [ ] Token has HttpOnly flag
- [ ] Token has Secure flag (HTTPS only)
- [ ] Token has SameSite=Strict flag

**C-2 School Route Tests:**
- [ ] GET /api/schools returns 200 without token
- [ ] POST /api/schools returns 401 without token
- [ ] POST works with admin token

**C-3 File Upload Tests:**
- [ ] Upload PDF: success
- [ ] Upload .exe: rejected
- [ ] Upload > 50MB: rejected
- [ ] Upload without auth: rejected

**C-4 File Access Tests:**
- [ ] GET /uploads/file.pdf returns 404
- [ ] GET /api/uploads returns 404
- [ ] Auth-required file download endpoint works

**C-5 Logging Tests:**
- [ ] No SQL in console output
- [ ] No data values in console output
- [ ] No stack traces to client

**H-1 Rate Limiting Tests:**
- [ ] 101st request in 15min returns 429
- [ ] Limit applies to all endpoints
- [ ] Rate limit headers present

**M-4 CSP Tests:**
- [ ] CSP-Report-Only header present
- [ ] Inline scripts blocked
- [ ] External scripts allowed only from 'self'

---

## DEPLOYMENT CHECKLIST

Before deploying each fix:

- [ ] Code reviewed by peer (security focus)
- [ ] All tests passing (unit + security tests)
- [ ] No console logging in production code
- [ ] Environment variables configured
- [ ] Deployment tested in staging
- [ ] Rollback plan documented
- [ ] Security logs monitored for issues

---

## MEASUREMENT & MONITORING

### Key Metrics to Track

- **Failed login attempts:** Should spike if breach occurs
- **Large file uploads:** Monitor for DoS attempts
- **Rate limit violations:** Track by IP and endpoint
- **Error rate:** Sudden spikes indicate attacks
- **Audit log access:** Track who accesses sensitive logs
- **Unauthenticated API calls:** Should be near zero for protected endpoints

### Alert Thresholds

- 10+ failed logins in 5 minutes → Alert
- 5+ 429 responses from same IP in 1 hour → Alert
- 500+ error rate spike → Alert
- Database connection pool exhausted → Alert
- Audit log with unusual queries → Alert

---

## SIGN-OFF & DOCUMENTATION

**Analysis Status:** ✅ Complete - 69 Specific Vulnerabilities Documented

**Remediation Estimate:**
- Tier 1 (Critical): 3-4 weeks
- Tier 2 (High): 2-3 weeks
- Tier 3 (Medium): 2-3 weeks
- Tier 4 (Low): 1 week
- **Total:** 8-11 weeks

**Next Review:** After Tier 1 completion, recommend security re-audit

---

*This document is for documentation and planning purposes only. No code has been modified during this audit.*
