# 📁 New Codebase Structure - Quick Reference

## 🌐 FRONTEND - Organized by Access Level

### Public Section (`/src/pages/public/` & `/src/components/public/`)
```
PAGES (Public-Facing):
  ✅ Home.jsx                  - Landing page
  ✅ About.jsx                 - About section
  ✅ Issuances.jsx             - Document browser
  ✅ OrganizationalChart.jsx   - Org chart viewer
  ✅ PublicSchools.jsx         - Schools directory

COMPONENTS (Public UI):
  ✅ Layout/                   - Main layout wrapper
  ✅ Header/                   - Navigation header
  ✅ Footer/                   - Footer section
  ✅ Carousel/                 - Homepage carousel
  ✅ CoreCards.jsx             - Info cards
  ✅ NewsCalendar.jsx          - News/events
  ✅ QuickInfo/                - Quick links
  ✅ PolicyCard/               - Policy display
  ✅ HomeIssuancesTeaser/      - Document previews
  ✅ Sidebar.jsx               - Navigation sidebar

SERVICES (Public Data):
  ✅ api.js                    - Axios config (shared)
  ✅ carousel.js               - Carousel data
  ✅ organizationalChart.js    - Org chart data
  ✅ schools.js                - Schools data
  ✅ stats.js                  - Stats data
  ✅ issuancesDocumentService.js - Document API
  ✅ mockData.js               - Mock carousel data
  ✅ mockDocs.js               - Mock documents
```

### Admin Section (`/src/pages/admin/` & `/src/components/admin/`)
```
PAGES (Admin-Only):
  🔐 AdminDashboard.jsx        - Admin overview
  🔐 AdminLogin.jsx            - Admin login
  🔐 AdminRecovery.jsx         - Password recovery
  🔐 AdminChangePassword.jsx   - Force password change
  🔐 CreateAdmin.jsx           - Create first admin
  🔐 UserManagement.jsx        - User CRUD
  🔐 AdminProfile.jsx          - Admin profile
  🔐 AdminIssuancesMgmt.jsx    - Issuance management
  🔐 SchoolManagement.jsx      - School management
  🔐 AuditLogManagement.jsx    - Audit viewer
  🔐 CarouselManagement.jsx    - Carousel management
  🔐 IssuanceManagement.jsx    - Folder/document mgmt
  🔐 OrganizationalChartManagement.jsx - Org chart mgmt
  🔐 StatusSummary.jsx         - Status display

COMPONENTS (Admin UI):
  🔐 RequireHttps.jsx          - HTTPS enforcer
  🔐 AdminHeader.jsx           - Admin header
  🔐 CreateFolderForm.jsx      - Folder creation
  🔐 Button/                   - Button component
  🔐 DocumentTable/            - Document table
  🔐 FileExplorer.jsx          - File browser
  🔐 FileList.jsx              - File list
  🔐 FolderButtons.jsx         - Folder nav
  🔐 IssuanceFilters.jsx       - Filter controls
  🔐 IssuanceForm.jsx          - Issuance form
  🔐 IssuanceHeader.jsx        - Page header
  🔐 IssuanceTabs.jsx          - Tab navigation
  🔐 OrganizationalChartForm.jsx - Org chart form
  🔐 UserManagementForm.jsx    - User form

SERVICES (Admin Data):
  🔐 adminManagement.js        - User APIs
  🔐 adminUsers.js             - User list APIs
  🔐 adminIssuancesMgmt.js     - Issuance admin APIs
  🔐 auditLogs.js              - Audit APIs
  🔐 documentService.js        - Document APIs
```

### Shared
```
/src/context/
  AuthContext.jsx             - JWT & user state (shared by all)

/src/App.jsx                  - Main router (uses public/admin pages)
```

---

## 🔧 BACKEND - Organized by Access Level

### Public Routes & Controllers (`/routes/public/` & `/controllers/public/`)
```
ROUTES:
  ✅ carousel.js               - GET /api/carousel
  ✅ issuances.js              - GET /api/issuances
  ✅ organizationalChart.js    - GET /api/organizational-chart
  ✅ schools.js                - GET /api/schools

CONTROLLERS:
  ✅ carouselController.js     - Carousel logic
  ✅ issuances.js              - Issuance queries
  ✅ organizationalChartController.js - Org chart logic
  ✅ schoolController.js       - School logic
  ✅ stats.js                  - Stats logic
```

### Admin Routes & Controllers (`/routes/admin/` & `/controllers/admin/`)
```
ROUTES:
  🔐 admin.js                  - /api/admin/* aggregate
  🔐 adminManagement.js        - /api/admin/users/*
  🔐 auth.js                   - /api/auth/* (login, logout, profile)
  🔐 createAdmin.js            - /api/create-admin
  🔐 upload.js                 - /api/upload
  🔐 auditLogs.js              - /api/audit-logs
  🔐 documents.js              - /api/documents
  🔐 issuances_admin.js        - /api/admin/issuances-mgmt/*

CONTROLLERS:
  🔐 adminManagementController.js - User CRUD
  🔐 adminUserController.js    - Admin profile
  🔐 auth.js                   - Auth logic
  🔐 createAdmin.js            - Bootstrap logic
  🔐 uploadController.js       - File upload
  🔐 auditLogController.js     - Audit retrieval
  🔐 folderAdminController.js  - Folder management
  🔐 issuanceAdminController.js - Issuance CRUD
```

### Main Router
```
/routes/index.js - Aggregates and mounts all routes:
  public/*  → public controllers
  admin/*   → admin controllers (with auth middleware)
```

---

## 🎯 Import Examples After Reorganization

### From Public Page (`/pages/public/Home.jsx`)
```javascript
import { coreSections } from '../services/public/mockData';
import Carousel from '../../components/public/Carousel/Carousel';
import api from '../services/public/api';
```

### From Admin Page (`/pages/admin/UserManagement.jsx`)
```javascript
import { getAllUsers } from '../services/admin/adminManagement';
import UserForm from '../../components/admin/UserManagementForm';
import api from '../services/public/api';  // API shared
```

### From Admin Component (`/components/admin/UserManagementForm.jsx`)
```javascript
import { createUser } from '../../services/admin/adminManagement';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/public/api';
```

### From Public Component (`/components/public/Carousel/Carousel.jsx`)
```javascript
import { sliderImages } from '../../../services/public/mockData';
import Header from '../Header/Header';
```

---

## 🔐 Security Model

```
PUBLIC FLOWS:
├── Any browser
├── → /pages/public/Issuances.jsx
├── → GET /api/carousel (no auth)
├── → GET /api/issuances (no auth)
├── → GET /api/schools (no auth)
└── → Display public data

ADMIN FLOWS:
├── Admin browser
├── → /pages/admin/AdminLogin.jsx
├── → POST /api/auth/login
├── → JWT stored in localStorage
├── → Added to Authorization header by api.js interceptor
├── → /api/admin/* routes check JWT
├── → authMiddleware validates token
├── → requireAdminRole checks role
├── → Admin can access protected data
└── → Audit logged for all actions
```

---

## ✅ What's Different

### BEFORE
```
pages/
  ├── Home.jsx
  ├── AdminDashboard.jsx
  ├── UserManagement.jsx
  ├── (all mixed together - unclear which is public)
```

### AFTER
```
pages/
  ├── public/
  │   ├── Home.jsx           (obviously public)
  │   ├── About.jsx
  │   └── Issuances.jsx
  │
  └── admin/                  (obviously admin-only)
      ├── AdminDashboard.jsx
      ├── UserManagement.jsx
      ├── AdminLogin.jsx
      └── ...
```

---

## 🚀 Benefits of This Structure

| Before | After |
|--------|-------|
| 🤔 "Is UserManagement.jsx admin?" | ✅ `/pages/admin/UserManagement.jsx` - Obviously admin |
| 🤔 "Where do I add the new public page?" | ✅ `/pages/public/` - Always here |
| 🤔 "Which services are for admin?" | ✅ `/services/admin/` - All here |
| 🤔 "Is this route public or protected?" | ✅ `/routes/admin/` routes have auth |
| Mixed imports everywhere | ✅ Clear import conventions |
| Hard to review security | ✅ Easy to audit public vs protected |

---

## 📊 Statistics

- **Frontend Pages:** 22 files → 5 public + 13 admin
- **Frontend Components:** 25+ files → 11 public + 14+ admin  
- **Frontend Services:** 12 files → 9 public + 5 admin
- **Backend Routes:** 13 files → 4 public + 9 admin
- **Backend Controllers:** 13 files → 5 public + 8 admin

**Total Reorganization:** ~100+ files organized into clear public/admin separation

---

## 🎓 Development Tips

1. **Adding a new public feature?**
   - Add page to `/pages/public/`
   - Add component to `/components/public/`
   - Add service to `/services/public/`
   - Add route to `/routes/public/`
   - Add controller to `/controllers/public/`

2. **Adding a new admin feature?**
   - Add page to `/pages/admin/`
   - Add component to `/components/admin/`
   - Add service to `/services/admin/`
   - Add route to `/routes/admin/`
   - Add controller to `/controllers/admin/`
   - ✅ Auth middleware automatically applied

3. **Debugging import errors?**
   - If in public/: use `../services/public/...`
   - If in admin/: use `../services/admin/...`
   - Adjust path depth based on folder nesting

---

**✨ Your codebase is now clearly organized and scalable!**

