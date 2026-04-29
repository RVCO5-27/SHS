# VERCEL + RENDER DEPLOYMENT GUIDE
## SHS Portal - Complete Production Deployment

**Date**: April 29, 2026  
**Frontend**: React on Vercel  
**Backend**: Node.js on Render  
**Database**: MySQL (Cloud options included)  

---

## 📋 TABLE OF CONTENTS

1. [Part 1: Prepare Your Code](#part-1-prepare-your-code)
2. [Part 2: Setup Database](#part-2-setup-mysql-database)
3. [Part 3: Deploy Backend on Render](#part-3-deploy-backend-on-render)
4. [Part 4: Deploy Frontend on Vercel](#part-4-deploy-frontend-on-vercel)
5. [Part 5: Configure CORS & API Connection](#part-5-configure-cors--api-connection)
6. [Part 6: Environment Variables](#part-6-environment-variables)
7. [Part 7: Testing Checklist](#part-7-final-testing-checklist)
8. [Part 8: Troubleshooting](#part-8-troubleshooting)

---

# PART 1: PREPARE YOUR CODE

## Step 1.1: Verify Your Project Structure

Your current structure:
```
project/
├── cid-shs-portal/
│   ├── backend/          ← Node.js app (deploy to Render)
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── [other files]
│   └── frontend/         ← React app (deploy to Vercel)
│       ├── package.json
│       ├── vite.config.js
│       ├── src/
│       └── dist/ (generated)
```

## Step 1.2: Backend Preparation

### Create `Procfile` for Render
```bash
# File: cid-shs-portal/backend/Procfile
web: node server.js
```

### Verify `package.json` for Render
```json
{
  "name": "shs-portal-backend",
  "version": "1.0.0",
  "main": "server.js",
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^5.2.1",
    "mysql2": "^3.19.1",
    "dotenv": "^17.3.1",
    "cors": "^2.8.6",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.3"
  }
}
```

### Create `.env.production` template
```bash
# File: cid-shs-portal/backend/.env.production
NODE_ENV=production
PORT=3000

# Database (will be configured in Render)
DB_HOST=your-mysql-host
DB_USER=your-db-user
DB_PASS=your-db-password
DB_NAME=shs_production

# Security
JWT_SECRET=your-secure-jwt-secret-here

# CORS (Vercel frontend URL)
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

## Step 1.3: Frontend Preparation

### Verify `vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
```

### Create `vercel.json` for Vercel
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Create `.env.example` for Vercel
```bash
# File: cid-shs-portal/frontend/.env.example
VITE_API_URL=https://your-render-app.onrender.com/api
VITE_APP_NAME=SHS Portal
```

### Create `.env.production` for Vercel
```bash
# File: cid-shs-portal/frontend/.env.production
VITE_API_URL=https://your-render-backend.onrender.com/api
VITE_APP_NAME=SHS Portal Production
```

## Step 1.4: Push to GitHub

```bash
cd c:\xampp\htdocs\project

# Add these new files
git add cid-shs-portal/backend/Procfile
git add cid-shs-portal/backend/.env.production
git add cid-shs-portal/frontend/vercel.json
git add cid-shs-portal/frontend/.env.production

# Commit
git commit -m "Add deployment configuration for Vercel and Render"

# Push
git push origin main
```

---

# PART 2: SETUP MYSQL DATABASE

## Step 2.1: Choose a MySQL Hosting Provider

### Option A: AWS RDS (Recommended for Production)
**Pros**: Managed, automatic backups, good performance  
**Cons**: Paid service (~$15-20/month minimum)

### Option B: PlanetScale (MySQL-compatible)
**Pros**: Free tier available, serverless, scaling  
**Cons**: Different protocol (serverless MySQL)

### Option C: Railway.app
**Pros**: Simple setup, visual dashboard, affordable  
**Cons**: Smaller free tier

### Option D: Use Render's Database
**Pros**: Same platform as backend  
**Cons**: Limited free tier

**Recommendation**: Use **Railway.app** or **PlanetScale** for free tier with growth options.

## Step 2.2: Setup Railway.app Database (Easiest)

### 1. Go to https://railway.app

### 2. Create Account
- Sign up with GitHub (recommended)
- Create new project

### 3. Add MySQL Service
```
Click "New" → Select "MySQL"
```

### 4. Get Connection Details
```
Variables tab:
- MYSQLHOST (database host)
- MYSQLPORT (usually 3306)
- MYSQLUSER (root or created user)
- MYSQLPASSWORD (generated password)
- MYSQLDATABASE (database name)
```

### 5. Create Production Database

**SSH into Railway MySQL**:
```bash
mysql -h <MYSQLHOST> -u <MYSQLUSER> -p<MYSQLPASSWORD>
```

**Create production database**:
```sql
CREATE DATABASE shs_production;

CREATE USER 'shs_prod'@'%' IDENTIFIED BY 'STRONG_PASSWORD_HERE';

GRANT ALL PRIVILEGES ON shs_production.* TO 'shs_prod'@'%';

FLUSH PRIVILEGES;
```

### 6. Import Schema
```bash
# Export from local:
mysqldump -u root shs > schema.sql

# Import to Railway:
mysql -h <MYSQLHOST> -u shs_prod -p shs_production < schema.sql
```

## Step 2.3: Setup PlanetScale (MySQL Alternative)

### 1. Go to https://planetscale.com

### 2. Create Account & Database
```
Sign up → Create new database → Select region
```

### 3. Get Connection String
```
Main password → Copy connection string
Format: mysql://user:password@host/database
```

### 4. Create Backup Password
```
Settings → Passwords → Create password for backups
```

### 5. Import Schema
```bash
# Using PlanetScale CLI:
pscale shell <database_name> main < schema.sql

# Or using MySQL client:
mysql -h <host> -u <user> -p <database> < schema.sql
```

---

# PART 3: DEPLOY BACKEND ON RENDER

## Step 3.1: Create Render Account

### 1. Go to https://render.com
### 2. Sign up with GitHub
### 3. Click "New +" → "Web Service"

## Step 3.2: Connect GitHub Repository

### 1. Select Repository
```
Connect → Select "RVCO5-27/SHS" repository
```

### 2. Configure Service
```
Name: shs-portal-backend
Environment: Node
Build Command: npm install
Start Command: npm start
Region: Singapore (or closest to you)
Plan: Free (or paid if upgrading)
```

### 3. Configure Build Settings
```
Root Directory: cid-shs-portal/backend
Node Version: 18.x (auto-detected from package.json)
```

## Step 3.3: Add Environment Variables

### In Render Dashboard:
```
1. Go to your service
2. Click "Environment"
3. Add these variables:
```

**Environment Variables to Add**:

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | production |
| `PORT` | `3000` | 3000 |
| `DB_HOST` | Railway/PlanetScale host | `xyz.railway.app` |
| `DB_USER` | Database user | `shs_prod` |
| `DB_PASS` | Database password | `your-secure-password` |
| `DB_NAME` | Database name | `shs_production` |
| `JWT_SECRET` | 64-char random string | `a7f3k9d2x8c1v5...` |
| `FRONTEND_ORIGIN` | Vercel URL (will add later) | `https://shs-portal.vercel.app` |
| `GMAIL_USER` | Email address | `admin@example.com` |
| `GMAIL_APP_PASSWORD` | App password | `xxxx-xxxx-xxxx-xxxx` |

### Generate JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3.4: Deploy Backend

### 1. Click "Deploy"
```
Render will:
- Clone your GitHub repo
- Install dependencies (npm install)
- Run start command (npm start)
- Show logs in dashboard
```

### 2. Monitor Deployment
```
Your backend is deploying. Watch the logs for:
- ✓ "npm install" completed
- ✓ "Server running on port 3000"
- ✓ "Successfully connected to shs_production"
```

### 3. Get Your Backend URL
```
Render will assign URL like:
https://shs-portal-backend.onrender.com

Test it:
curl https://shs-portal-backend.onrender.com/api/ping
# Expected: {"status":"ok"}
```

**Save this URL** - you'll need it for frontend configuration.

## Step 3.5: Test Backend Health

### Health Check
```bash
curl https://shs-portal-backend.onrender.com/api/ping
# Should return: {"status":"ok"}
```

### Database Connection Check
```
Check Render logs for:
"Successfully connected to shs_production (pool)"
```

### SSL Certificate
```
Render automatically provides HTTPS
No additional configuration needed
```

---

# PART 4: DEPLOY FRONTEND ON VERCEL

## Step 4.1: Create Vercel Account

### 1. Go to https://vercel.com
### 2. Sign up with GitHub
### 3. Click "New Project"

## Step 4.2: Import Project

### 1. Select Repository
```
Import Git Repository → Select "RVCO5-27/SHS"
```

### 2. Configure Project
```
Project Name: shs-portal-frontend
Root Directory: cid-shs-portal/frontend
Framework: Vite
Node Version: 18.x
```

## Step 4.3: Add Environment Variables

### In Vercel Dashboard:
```
1. Go to Settings → Environment Variables
2. Add these variables:
```

**For Production**:

| Key | Value | Example |
|-----|-------|---------|
| `VITE_API_URL` | Render backend URL | `https://shs-portal-backend.onrender.com/api` |
| `VITE_APP_NAME` | App name | `SHS Portal` |

**Add to Production Environment Only**:
```
In Vercel:
- Production: https://shs-portal-backend.onrender.com/api
- Preview: https://shs-portal-backend.onrender.com/api
- Development: http://localhost:5000/api (for local testing)
```

## Step 4.4: Deploy Frontend

### 1. Click "Deploy"
```
Vercel will:
- Clone your GitHub repo
- Run build command (npm run build)
- Create dist/ folder
- Deploy to CDN
```

### 2. Monitor Build
```
Watch for:
- ✓ "npm install" completed
- ✓ "npm run build" succeeded
- ✓ Deployment ready
```

### 3. Get Your Frontend URL
```
Vercel assigns URL like:
https://shs-portal-frontend.vercel.app
or
https://shs-portal.vercel.app (if configured)

Visit it in browser to verify
```

## Step 4.5: Custom Domain (Optional)

### Add Custom Domain
```
1. In Vercel Settings → Domains
2. Add your domain (e.g., shs-portal.example.com)
3. Update DNS records as instructed
4. SSL auto-configured by Vercel
```

---

# PART 5: CONFIGURE CORS & API CONNECTION

## Step 5.1: Update Backend CORS

### Edit Backend server.js
```javascript
// In cid-shs-portal/backend/server.js

function getCorsAllowedOrigins() {
  const raw = process.env.FRONTEND_ORIGIN;
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  
  // Default for development
  return ['http://localhost:5173', 'http://localhost:3000'];
}

app.use(
  cors({
    origin(origin, callback) {
      const allowed = getCorsAllowedOrigins();
      if (!origin) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

### Update Render Environment Variables
```
In Render Dashboard:
FRONTEND_ORIGIN=https://shs-portal-frontend.vercel.app
```

### Redeploy Backend
```
In Render:
1. Go to your backend service
2. Click "Redeploy"
3. Wait for deployment to complete
```

## Step 5.2: Update Frontend API Configuration

### Update API Service
```javascript
// File: cid-shs-portal/frontend/src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
```

## Step 5.3: Verify CORS Configuration

### Test CORS in Browser
```javascript
// Open browser console and run:
fetch('https://shs-portal-backend.onrender.com/api/ping', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e))
```

### Expected Response
```javascript
Success: {status: 'ok'}
```

### If CORS Error
```
Error: Access to XMLHttpRequest has been blocked by CORS policy

Solution:
1. Check FRONTEND_ORIGIN in Render
2. Ensure Vercel URL is exactly correct
3. Redeploy backend
4. Clear browser cache
5. Test in incognito window
```

## Step 5.4: Update Vercel Environment Variables

### In Vercel Dashboard:
```
Settings → Environment Variables

Update:
VITE_API_URL = https://shs-portal-backend.onrender.com/api
```

### Redeploy Frontend
```
1. Go to Deployments
2. Click "Redeploy" on latest deployment
3. Or push new commit to main branch
```

---

# PART 6: ENVIRONMENT VARIABLES COMPLETE SETUP

## Step 6.1: Environment Variables Checklist

### Backend (Render)
```
✓ NODE_ENV = production
✓ PORT = 3000
✓ DB_HOST = railway/planetscale host
✓ DB_USER = database user
✓ DB_PASS = database password
✓ DB_NAME = shs_production
✓ JWT_SECRET = 64-char random string
✓ FRONTEND_ORIGIN = https://shs-portal.vercel.app
✓ GMAIL_USER = your-email@gmail.com
✓ GMAIL_APP_PASSWORD = 16-char app password
```

### Frontend (Vercel)
```
✓ VITE_API_URL = https://shs-portal-backend.onrender.com/api
✓ VITE_APP_NAME = SHS Portal
```

### Database (Railway/PlanetScale)
```
✓ Host = provided by service
✓ Port = 3306 (MySQL default)
✓ User = shs_prod
✓ Password = strong password
✓ Database = shs_production
✓ Backups = automated
```

## Step 6.2: Verify All Variables Are Set

### Check Render Backend
```
1. Render Dashboard
2. Your service → Environment
3. Verify all variables listed above
4. Check for any missing values
```

### Check Vercel Frontend
```
1. Vercel Dashboard
2. Settings → Environment Variables
3. Verify VITE_API_URL is correct
4. Verify deployed to Production
```

### Check Database Access
```bash
# From local machine
mysql -h <DB_HOST> -u shs_prod -p shs_production
# Should connect successfully

# Check tables exist
SHOW TABLES;
```

## Step 6.3: Sensitive Data Checklist

```
✓ No secrets in source code
✓ No .env file in git
✓ JWT_SECRET is unique and strong
✓ Database password is strong
✓ Gmail app password used (not main password)
✓ All sensitive data in environment variables only
✓ .gitignore includes .env and .env.*.local
```

---

# PART 7: FINAL TESTING CHECKLIST

## Step 7.1: Frontend Deployment Test

### ✅ Basic Frontend Tests
- [ ] Frontend loads without errors
- [ ] No console errors in browser (F12)
- [ ] All pages load correctly
- [ ] CSS/styles applied properly
- [ ] Images/assets load
- [ ] Responsive design works on mobile

### ✅ Navigation Tests
- [ ] Home page loads
- [ ] Navigation menu works
- [ ] Can navigate between pages
- [ ] Back/forward buttons work
- [ ] URL routing correct

### ✅ Frontend API Connection
- [ ] Browser Network tab shows requests to Render backend
- [ ] API calls have correct base URL
- [ ] CORS headers present in responses
- [ ] No CORS errors in console

## Step 7.2: Backend Deployment Test

### ✅ Basic Backend Tests
```bash
# Health check
curl https://shs-portal-backend.onrender.com/api/ping
# Expected: {"status":"ok"}

# Check logs
# In Render dashboard, view logs for:
# "Server running on port 3000"
# "Successfully connected to shs_production"
```

### ✅ Database Connection
```
In Render logs, verify:
- Database connection established
- No connection errors
- Migrations applied (if any)
```

### ✅ Backend API Tests
```bash
# Test login endpoint
curl -X POST https://shs-portal-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Expected: JWT token or error (not connection error)
```

## Step 7.3: Authentication Flow Test

### ✅ Login Test (In Browser)
1. Open frontend: https://shs-portal.vercel.app
2. Go to login page
3. Enter admin credentials
4. Click login
5. Check browser console (F12):
   - [ ] No CORS errors
   - [ ] No network errors
   - [ ] Response includes token
6. Check localStorage:
   ```javascript
   // In console
   localStorage.getItem('token')
   // Should return JWT token
   ```
7. Verify redirected to dashboard

### ✅ Logout Test
1. Click logout button
2. Check localStorage cleared:
   ```javascript
   localStorage.getItem('token')
   // Should return null
   ```
3. Redirected to login page

## Step 7.4: Data Operations Test

### ✅ Create Operation
1. Login successfully
2. Navigate to create form (issuances, etc.)
3. Fill form with test data
4. Click submit
5. Check browser Network tab:
   - [ ] POST request sent
   - [ ] Response status 201 or 200
   - [ ] Response includes created item
6. Verify item appears in list

### ✅ Read Operation
1. Go to list/table page
2. Check Network tab:
   - [ ] GET request sent to correct endpoint
   - [ ] Response status 200
   - [ ] Data displayed in table
3. Verify all columns show data

### ✅ Update Operation
1. Click edit on an item
2. Change a field
3. Click save
4. Check Network tab:
   - [ ] PUT request sent
   - [ ] Response status 200
   - [ ] Updated data returned
5. Verify changes reflected in list

### ✅ Delete Operation
1. Click delete on an item
2. Confirm deletion
3. Check Network tab:
   - [ ] DELETE request sent
   - [ ] Response status 200 or 204
4. Verify item removed from list

## Step 7.5: File Upload Test

### ✅ Upload Test
1. Navigate to upload form
2. Select file (under 500MB)
3. Click upload
4. Check Network tab:
   - [ ] POST request to /api/upload
   - [ ] Status 200/201
   - [ ] Response includes file path
5. Verify file stored and accessible

## Step 7.6: Error Handling Test

### ✅ Invalid Login
1. Login with wrong credentials
2. Verify error message displayed (not expose system details)
3. No token created
4. Redirected back to login

### ✅ Expired Token
1. Login successfully
2. Wait for token expiry OR manually delete token:
   ```javascript
   localStorage.removeItem('token')
   ```
3. Try accessing protected page
4. Verify redirected to login

### ✅ CORS Error Recovery
1. Stop backend (or simulate with network throttle)
2. Try login
3. Verify user-friendly error displayed
4. Restart backend
5. Try again - should work

### ✅ Database Error
1. Verify graceful error handling
2. Check that error messages don't expose SQL
3. Users see friendly message

## Step 7.7: Performance Test

### ✅ Page Load Time
- [ ] Home page loads in < 3 seconds
- [ ] Dashboard loads in < 2 seconds
- [ ] List pages load in < 2 seconds
- [ ] Forms load in < 1 second

### ✅ API Response Time
- [ ] Login endpoint: < 500ms
- [ ] List endpoint: < 1s (depending on data)
- [ ] Health check: < 100ms

### ✅ Bundle Size Check
```bash
# In Vercel build logs:
# Verify bundle size acceptable
# Usually < 1MB main bundle (after gzip)
```

## Step 7.8: Security Tests

### ✅ HTTPS Verification
- [ ] Frontend: https:// in URL
- [ ] Backend: https:// in URL
- [ ] Padlock icon visible in browser
- [ ] SSL certificate valid

### ✅ CORS Configuration
- [ ] Frontend can access backend
- [ ] Other domains cannot access backend
- [ ] Test with curl from external origin (should fail)

### ✅ Authentication Security
- [ ] JWT tokens expire
- [ ] Cannot access protected routes without token
- [ ] Token not visible in URL
- [ ] Token cleared on logout

### ✅ Input Validation
- [ ] SQL injection attempts rejected
- [ ] XSS attempts prevented
- [ ] Large inputs handled gracefully
- [ ] Special characters sanitized

## Step 7.9: Mobile Test

### ✅ Responsive Design
- [ ] Test on phone browser (or DevTools)
- [ ] Layout adapts to mobile width
- [ ] Touch interactions work
- [ ] Buttons are clickable
- [ ] Forms are usable

### ✅ Mobile Performance
- [ ] Pages load reasonably fast on 4G
- [ ] No horizontal scrolling
- [ ] Images scaled for mobile

## Step 7.10: Cross-Browser Test

### ✅ Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### ✅ Features in Each Browser
- [ ] Login works
- [ ] CRUD operations work
- [ ] File upload works
- [ ] No console errors

## Step 7.11: Monitoring Setup

### ✅ Error Monitoring
```
Render Dashboard:
- [ ] Check "Logs" tab for errors
- [ ] Setup email alerts for crashes
```

### ✅ Application Logs
```
Render Logs to Check:
- [ ] No "ERROR" messages
- [ ] No "WARN" messages (except expected ones)
- [ ] Startup logs show healthy initialization
```

### ✅ Database Health
```
Railway/PlanetScale:
- [ ] Connection pool healthy
- [ ] No connection timeouts
- [ ] Storage usage acceptable
```

## Step 7.12: Smoke Test Summary

### Quick Test Flow (5 minutes)
1. ✅ Open frontend: https://shs-portal.vercel.app
2. ✅ Login with admin account
3. ✅ Navigate to main feature (issuances)
4. ✅ Create test item
5. ✅ Edit test item
6. ✅ View test item
7. ✅ Delete test item
8. ✅ Logout
9. ✅ Check browser console: No errors
10. ✅ Check Render logs: No errors

**Result**: If all 10 items pass ✅, system is production-ready!

---

# PART 8: TROUBLESHOOTING

## Issue: CORS Error

### Error Message
```
Access to XMLHttpRequest at 'https://...' from origin 'https://...' 
has been blocked by CORS policy
```

### Causes & Solutions
```
1. FRONTEND_ORIGIN not set in Render
   → Go to Render → Environment → Add FRONTEND_ORIGIN

2. FRONTEND_ORIGIN doesn't match Vercel URL
   → Ensure it's exactly: https://shs-portal.vercel.app
   → Check for trailing slashes

3. Backend not redeployed after changing FRONTEND_ORIGIN
   → Click "Redeploy" in Render dashboard

4. Browser cache
   → Clear cookies/cache or use incognito window
```

### Quick Fix
```bash
# In Render:
1. Settings → Environment
2. Find FRONTEND_ORIGIN
3. Update to exact Vercel URL
4. Click "Redeploy"
5. Wait 2-3 minutes
6. Try again in new incognito window
```

## Issue: Database Connection Failed

### Error Message
```
connect ECONNREFUSED or
Access denied for user 'shs_prod'@'%'
```

### Causes & Solutions
```
1. Wrong database credentials
   → Double-check DB_HOST, DB_USER, DB_PASS
   → Copy from Railway/PlanetScale exactly

2. Database not accepting connections
   → Check Railway/PlanetScale dashboard
   → Verify service is running

3. Firewall blocking connection
   → Railway/PlanetScale have open connections
   → Check if IP whitelist enabled

4. Database doesn't exist
   → Login and verify: CREATE DATABASE shs_production;
```

### Quick Fix
```bash
# Test connection locally first:
mysql -h <DB_HOST> -u <DB_USER> -p<DB_PASS> -e "SELECT 1"

# Then verify in Render environment variables:
- DB_HOST = correct
- DB_USER = correct
- DB_PASS = correct (no extra spaces)
- DB_NAME = correct
```

## Issue: Frontend Can't Connect to Backend

### Error Message
```
Network Error or
Failed to fetch (in console)
```

### Causes & Solutions
```
1. VITE_API_URL not set or incorrect
   → Go to Vercel → Settings → Environment Variables
   → Verify VITE_API_URL = https://shs-portal-backend.onrender.com/api

2. Frontend not redeployed after env change
   → Click "Redeploy" in Vercel
   → Or push new commit

3. Backend is down or not deployed
   → Check Render dashboard for backend
   → Check if service is running
   → View logs for errors

4. API endpoint doesn't exist
   → Verify endpoint exists on backend
   → Check backend routes/api.js
```

### Quick Fix
```javascript
// In browser console, check:
console.log(import.meta.env.VITE_API_URL)
// Should show: https://shs-portal-backend.onrender.com/api

// Then test:
fetch(import.meta.env.VITE_API_URL + '/ping')
  .then(r => r.json())
  .then(console.log)
```

## Issue: 502 Bad Gateway on Render

### Error Message
```
502 Bad Gateway
```

### Causes & Solutions
```
1. Backend crashed
   → Check Render logs for error
   → Usually shown in logs tab

2. Port not configured correctly
   → Verify PORT=3000 in Render environment
   → Verify server.js listens on process.env.PORT

3. Missing dependencies
   → Check if npm install completed successfully
   → Check for missing packages

4. Environment variable issue
   → Missing required env variables
   → Check logs for "undefined" errors
```

### Quick Fix
```
1. Go to Render dashboard
2. Click your backend service
3. Go to Logs tab
4. Scroll to see error message
5. Fix the issue (usually env var)
6. Click "Redeploy"
```

## Issue: Build Fails on Vercel

### Error Message
```
Build failed / npm run build failed
```

### Causes & Solutions
```
1. Missing dependencies
   → Run npm install locally
   → Verify package.json has all dependencies

2. ESLint errors
   → Fix code issues
   → Or disable in vite.config.js

3. Vite config issue
   → Verify vite.config.js is correct
   → Check for syntax errors

4. Node version mismatch
   → Vercel defaults to 18.x
   → Usually not an issue
```

### Quick Fix
```bash
# Test locally:
cd cid-shs-portal/frontend
npm install
npm run build

# Fix any errors, then:
git add .
git commit -m "Fix build errors"
git push origin main

# Vercel will auto-redeploy
```

## Issue: Token Not Persisting After Reload

### Problem
```
User logs in, then refreshes page → logged out again
```

### Causes & Solutions
```
1. Token not saved to localStorage
   → Check API response has token
   → Verify localStorage save code

2. CORS credentials not enabled
   → Ensure withCredentials: true in axios config
   → Ensure cookies enabled in browser

3. Storage quota exceeded
   → Unlikely but possible with large tokens
```

### Quick Fix
```javascript
// In api.js, ensure:
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // ← This is important
})

// In login handler:
const token = response.data.token
localStorage.setItem('token', token)  // Save token
```

## Issue: Emails Not Sending (Password Recovery)

### Problem
```
Password recovery email not received
```

### Causes & Solutions
```
1. Gmail app password wrong
   → Generate new in Google Account
   → Use 16-char password, no spaces

2. Gmail service not configured
   → Check GMAIL_USER is set
   → Check GMAIL_APP_PASSWORD is set

3. Email bounce back
   → Check email address valid
   → Check spam folder

4. SMTP timeout
   → Render might have SMTP restrictions
   → Use more reliable email service (SendGrid, etc.)
```

### Quick Fix
```
1. Test email service locally
2. Verify GMAIL_USER and GMAIL_APP_PASSWORD in .env
3. Send test email
4. Check spam folder
5. If still not working, use alternative email service
```

## Issue: Slow Page Load

### Problem
```
Frontend takes 5+ seconds to load
```

### Causes & Solutions
```
1. Large bundle size
   → Check Vercel build logs for bundle size
   → Remove unused dependencies
   → Enable code splitting

2. Slow backend API
   → Check Render backend performance
   → Look for slow queries
   → Add database indexes

3. Network latency
   → Check if backend in same region
   → Consider moving closer geographically
```

### Quick Check
```javascript
// In browser console:
console.time('Load')
fetch(import.meta.env.VITE_API_URL + '/ping')
  .then(r => r.json())
  .then(() => console.timeEnd('Load'))

// Check Vercel build logs for bundle size
```

## Issue: Database Quota Exceeded

### Problem
```
Database storage full or exceeded free tier limits
```

### Causes & Solutions
```
1. Too much test data
   → Clean up old test records
   → Delete unnecessary files

2. Logs filling database
   → Archive old audit logs
   → Setup log rotation

3. Need more storage
   → Upgrade plan on Railway/PlanetScale
   → Or migrate to larger service
```

### Quick Fix
```sql
-- Check database size
SELECT 
  TABLE_NAME,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'shs_production'
ORDER BY size_mb DESC;

-- Delete old audit logs if needed
DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

## Getting Help

### Check These Resources
1. **Render Docs**: https://render.com/docs
2. **Vercel Docs**: https://vercel.com/docs
3. **Railway Docs**: https://docs.railway.app
4. **Your Backend Logs**: Render → Logs tab
5. **Browser Console**: F12 → Console tab
6. **Network Tab**: F12 → Network tab

### Enable Debug Mode
```
In Render environment:
DEBUG=* npm start

This provides verbose logging for troubleshooting
```

---

## QUICK REFERENCE: URLs & Credentials

### After Successful Deployment

| Item | URL/Value |
|------|-----------|
| Frontend | https://shs-portal.vercel.app |
| Backend | https://shs-portal-backend.onrender.com |
| Database (Railway) | Host: xyz.railway.app |
| Login | admin / password |
| Health Check | curl https://shs-portal-backend.onrender.com/api/ping |

---

## DEPLOYMENT COMPLETION CHECKLIST

### Pre-Deployment ✅
- [ ] Code pushed to GitHub
- [ ] Procfile created
- [ ] Environment files prepared
- [ ] Database service selected

### Render Backend ✅
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Environment variables added (all 10+)
- [ ] Deployment successful
- [ ] Backend URL obtained
- [ ] Health check working

### Vercel Frontend ✅
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Environment variables added
- [ ] Build successful
- [ ] Frontend URL obtained
- [ ] Can access frontend in browser

### Database ✅
- [ ] Database service setup (Railway/PlanetScale)
- [ ] Connection credentials obtained
- [ ] Schema imported
- [ ] Production user created
- [ ] Database accessible

### Integration ✅
- [ ] CORS configured in backend
- [ ] API URL in frontend environment
- [ ] Backend redeployed with CORS settings
- [ ] Frontend redeployed with API URL
- [ ] CORS error resolved
- [ ] API calls working

### Testing ✅
- [ ] Frontend loads
- [ ] Login works
- [ ] CRUD operations work
- [ ] File upload works
- [ ] API errors handled gracefully
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All 10 smoke tests pass

### Going Live ✅
- [ ] Monitoring setup (Render logs)
- [ ] Backups configured (database service)
- [ ] Team trained
- [ ] Rollback plan ready
- [ ] Error logging configured
- [ ] Domain configured (optional)

---

**Status**: ✅ Deployment Guide Complete

**Questions?** Check TROUBLESHOOTING section above

**Ready to start?** Begin with PART 1!
