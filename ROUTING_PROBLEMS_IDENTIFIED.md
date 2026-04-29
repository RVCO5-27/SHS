# ROUTING PROBLEMS IDENTIFIED

## Issue Analysis

### 1. **Schools Route - INCONSISTENT PROTECTION**
**File:** `routes/schools.js`
**Current:** Protected by `authMiddleware` and `requireAdminRole`
**Problem:** 
- Public endpoint `/api/schools` should be available to ALL users (public data)
- Admin-only endpoint should be `/api/admin/schools` for management

**Expected:**
- `/api/schools` (GET) - Public read access
- `/api/admin/schools` (POST/PUT/DELETE) - Admin only

**Status:** ⚠️ NEEDS FIX

---

### 2. **Auth Routes - Missing Public Access**
**File:** `routes/auth.js`
**Current:** Mixed protection levels
**Problem:**
- `/auth/login` should be PUBLIC (not admin only)
- `/auth/logout` should be PRIVATE (for authenticated users)
- But route is globally protected

**Status:** ⚠️ NEEDS FIX

---

### 3. **Routes Organization - Not Clearly Separated**
**Problem:**
- Public routes mixed with protected routes
- No clear distinction between `/api/public/` and `/api/admin/`
- Carousel is public but management is admin
- Schools show both public (index) and admin (CRUD)
- Issuances similarly split

**Current Structure:**
```
/api/
├── /carousel (mixed: public GET, admin POST/PUT/DELETE)
├── /schools (ALL protected - should have public endpoint)
├── /issuances (public only)
├── /admin/
│   ├── /users
│   ├── /issuances-mgmt
└── Public routes at root level
```

**Status:** ⚠️ NEEDS REORGANIZATION

---

### 4. **Document Routes - Unclear Access**
**File:** `routes/documents.js`
**Problem:**
- Mix of public and admin operations
- No clear separation of who can access what
- Upload endpoint exists but permission unclear

**Status:** ⚠️ NEEDS CLARIFICATION

---

### 5. **Audit Logs - Overly Restricted**
**File:** `routes/auditLogs.js`
**Current:** All endpoints require `requireAdminRole` and some require `requireSuperAdmin`
**Problem:**
- Audit stats might need to be accessible to regular admins
- Export might have different permission levels
- Unclear which operations need which roles

**Status:** ⚠️ NEEDS CLARIFICATION

---

## Route Summary

### Frontend Routes (App.jsx)
```
PUBLIC:
/                 -> Home
/about            -> About
/issuances        -> Issuances (public browsing)
/org-chart        -> OrganizationalChart
/schools          -> PublicSchools

AUTH:
/create-admin     -> CreateAdmin
/admin/login      -> AdminLogin
/admin/reset-access -> AdminRecovery
/admin/change-password -> AdminChangePassword

PROTECTED (Admin):
/admin/dashboard           -> AdminDashboard
/admin/users              -> UserManagement
/admin/carousel           -> CarouselManagement
/admin/issuances-mgmt     -> IssuanceManagement
/admin/organizational-chart -> OrganizationalChartManagement
/admin/profile            -> AdminProfile
/admin/schools            -> SchoolManagement
/admin/audit-logs         -> AuditLogManagement
```

### Backend Routes (routes/index.js)
```
/carousel                    -> carouselController
/organizational-chart        -> organizationalChartController
/schools                     -> schoolController (ISSUE: protected, should have public endpoint)
/issuances                   -> issuancesController (public)
/stats                       -> statsController
/create-admin                -> createAdminController
/upload                      -> uploadController
/auth                        -> authController
/admin                       -> admin.js (nested)
  /users                     -> adminManagement
  /issuances-mgmt            -> issuances_admin
/documents                   -> documentsRoutes
/audit-logs                  -> auditLogsController
```

---

## Recommendations

### HIGH PRIORITY
1. **Split schools.js** - Separate public and admin endpoints
   - Keep `/api/schools` public for GET
   - Move admin CRUD to `/api/admin/schools`

2. **Fix auth routes** - Ensure proper public access
   - `/api/auth/login` should be PUBLIC
   - `/api/auth/logout` should be PRIVATE
   - Remove global admin protection from auth.js

3. **Clarify carousel routes**
   - `/api/carousel` - Public GET
   - `/api/admin/carousel` - Admin CRUD

### MEDIUM PRIORITY
4. Document expected permission levels for each route
5. Create route documentation with public/protected markers
6. Standardize route naming conventions

### OPTIONAL
7. Consider organizing routes into:
   - `/api/public/` - Public endpoints
   - `/api/private/` - Authenticated user endpoints
   - `/api/admin/` - Admin only endpoints

---

## Impact if Not Fixed

- ⚠️ Public schools data might not be accessible
- ⚠️ Users cannot login (if auth is globally protected)
- ⚠️ PublicSchools page will fail
- ⚠️ Inconsistent permissions across similar routes
