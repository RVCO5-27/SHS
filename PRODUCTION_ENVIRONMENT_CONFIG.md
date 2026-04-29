# PRODUCTION ENVIRONMENT CONFIGURATION GUIDE

## Overview
This guide ensures your system is properly configured for production deployment with maximum security.

---

## PART 1: BACKEND ENVIRONMENT VARIABLES (.env)

### Current Status (INSECURE - DO NOT USE IN PRODUCTION)
```env
❌ JWT_SECRET=change-me  (Too simple, publicly visible)
❌ GMAIL_APP_PASSWORD exposed in repository
❌ NODE_ENV not specified (defaults to development)
```

### Production Configuration Template

**File: `cid-shs-portal/backend/.env` (Production)**

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=your-production-db-host
DB_USER=shs_prod_user
DB_PASS=STRONG_DATABASE_PASSWORD_HERE
DB_NAME=shs_production

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=5000
NODE_ENV=production

# ============================================
# SECURITY - JWT TOKENS
# ============================================
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_64_character_hex_string_here
JWT_EXPIRY=24h

# ============================================
# CORS - FRONTEND ACCESS
# ============================================
# List all production domains (comma-separated)
FRONTEND_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# ============================================
# EMAIL CONFIGURATION (Password Recovery)
# ============================================
# Option 1: Gmail with App Password
GMAIL_USER=your-deped-email@deped.gov.ph
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Option 2: Standard SMTP
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-specific-password

SMTP_FROM=noreply@deped.gov.ph

# ============================================
# LOGGING (Optional)
# ============================================
LOG_LEVEL=warn
LOG_FILE=/var/log/shs/error.log
```

---

## PART 2: FRONTEND ENVIRONMENT VARIABLES

### Production .env for Frontend

**File: `cid-shs-portal/frontend/.env.production`**

```env
# Production API endpoint
VITE_API_URL=https://your-production-domain.com/api

# App configuration
VITE_APP_NAME=SHS Portal
VITE_APP_VERSION=1.0.0

# Feature flags (if using feature toggles)
VITE_ENABLE_DEBUG=false
```

### Development .env for Frontend

**File: `cid-shs-portal/frontend/.env`**

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SHS Portal (Dev)
VITE_ENABLE_DEBUG=true
```

---

## PART 3: SECURE CREDENTIAL GENERATION

### Generate JWT Secret (Required)

**Method 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Expected Output:**
```
a7f3k9d2x8qw1e5r6t7y8u9i0o1p2s3d4f5g6h7j8k9l0z
```

**Method 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

### Generate Database Password

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"

# Option 2: OpenSSL
openssl rand -base64 24
```

### Generate Gmail App Password (If Using Gmail)

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Copy it exactly (no spaces)

---

## PART 4: DATABASE SECURITY CONFIGURATION

### Create Production Database User

**SQL Commands:**

```sql
-- 1. Create production database user with minimal permissions
CREATE USER 'shs_prod_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';

-- 2. Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON shs_production.* TO 'shs_prod_user'@'localhost';

-- 3. NEVER grant super admin privileges
-- GRANT ALL PRIVILEGES is dangerous!

-- 4. Apply changes
FLUSH PRIVILEGES;

-- 5. Verify user permissions
SHOW GRANTS FOR 'shs_prod_user'@'localhost';
```

### Database Best Practices

```sql
-- 1. Use strong password for root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NEW_STRONG_PASSWORD';

-- 2. Remove anonymous users
DROP USER ''@'localhost';
DROP USER ''@'%';

-- 3. Remove remote root access
DROP USER 'root'@'%';

-- 4. Verify secure setup
SELECT user, host FROM mysql.user;
```

---

## PART 5: .gitignore CONFIGURATION

### What NOT to Commit

**File: `.gitignore` (Already Updated)**

```gitignore
# Environment files - CRITICAL
.env
.env.local
.env.production
.env.*.local

# Dependencies
node_modules/
npm-debug.log
npm-error.log

# Build artifacts
dist/
build/
out/

# Debug files
recovery_debug.log
*.debug.log

# IDE and OS
.vscode/
.idea/
.DS_Store
Thumbs.db

# Sensitive data
*.key
*.pem
*.pfx
secrets/
```

### Verify .env is Ignored

```bash
git status
# Should show NO .env files

# If .env was previously committed, remove it:
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## PART 6: FILE PERMISSIONS (Server Deployment)

### Linux/Unix Permissions

```bash
# Make sure .env is readable only by app owner
chmod 600 backend/.env

# Make uploads directory writable by app
chmod 755 backend/uploads
chmod 755 backend/uploads/*

# Node application ownership
chown -R app_user:app_group backend/
chown -R app_user:app_group frontend/dist

# Database files
chmod 700 /var/lib/mysql
```

---

## PART 7: SECURITY CONFIGURATION CHECKLIST

### Before Deploying to Production

#### Environment Variables
- [ ] JWT_SECRET is 32+ characters (generated with crypto.randomBytes)
- [ ] Database password is strong (12+ mixed characters)
- [ ] NODE_ENV=production (not development)
- [ ] FRONTEND_ORIGIN specifies exact domain(s) only
- [ ] Email credentials use app-specific passwords (not main account password)
- [ ] .env file is NOT committed to git
- [ ] .env has restrictive file permissions (600)

#### Database Security
- [ ] Production user created with minimal permissions
- [ ] root user has strong password (different from development)
- [ ] Anonymous users removed from MySQL
- [ ] Remote root access disabled
- [ ] Database backups stored securely

#### API Security
- [ ] CORS configured for production domain only (not '*')
- [ ] HTTPS/SSL enabled
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose system details
- [ ] JWT tokens have reasonable expiry (24h)

#### File Security
- [ ] No hardcoded passwords or keys in source code
- [ ] Sensitive files have appropriate permissions
- [ ] Uploads directory permissions set correctly
- [ ] .gitignore prevents accidental commits

---

## PART 8: RUNNING IN PRODUCTION

### With Environment Variables

**Using Direct Environment:**
```bash
export NODE_ENV=production
export JWT_SECRET=your_secure_key_here
export DB_HOST=production-db
npm start
```

**Using .env File:**
```bash
# Node automatically loads .env via dotenv
npm start
```

**Using PM2 (Recommended):**
```bash
# Create ecosystem.config.js
module.exports = {
  apps: [{
    name: 'shs-backend',
    script: './server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 2,
    exec_mode: 'cluster',
    error_file: './logs/error.log',
    out_file: './logs/out.log'
  }]
};

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## PART 9: COMMON MISTAKES TO AVOID

### Critical Errors

1. **Committing .env to Git**
   ```bash
   ❌ git add .env  # NEVER DO THIS
   ✓ git add .env.example  # Do this instead
   ```

2. **Using Weak JWT Secret**
   ```bash
   ❌ JWT_SECRET=secret  # Too simple
   ✓ JWT_SECRET=aB7x2k9Q5mL8pD3wE4rT6yU... (32+ chars)
   ```

3. **Hardcoding Credentials**
   ```bash
   ❌ const password = 'hardcoded-password';
   ✓ const password = process.env.DB_PASS;
   ```

4. **Wrong Environment**
   ```bash
   ❌ NODE_ENV=development  # In production
   ✓ NODE_ENV=production
   ```

5. **CORS Set to Allow All**
   ```bash
   ❌ FRONTEND_ORIGIN=*  # Allows any origin
   ✓ FRONTEND_ORIGIN=https://yourdomain.com
   ```

---

## PART 10: VERIFICATION

### Verify Environment Configuration

```bash
# 1. Check .env exists and has values
ls -la backend/.env

# 2. Verify JWT_SECRET is strong
cat backend/.env | grep JWT_SECRET

# 3. Test database connection
cd backend
npm start
# Should see: "Successfully connected to shs_production (pool)"

# 4. Verify frontend build works
cd frontend
npm run build
# Should create dist/ folder

# 5. Check CORS configuration in logs
# When frontend connects, should see connection accepted

# 6. Test API endpoint
curl http://localhost:5000/api/ping
# Should return: {"status":"ok"}
```

---

## PRODUCTION ENVIRONMENT VARIABLES (Summary)

### Required Variables (DO NOT SKIP)

| Variable | Type | Example | Notes |
|----------|------|---------|-------|
| DB_HOST | string | localhost | Production database server |
| DB_USER | string | shs_prod_user | Limited permissions user |
| DB_PASS | string | SecurePass123! | Strong password |
| DB_NAME | string | shs_production | Production database name |
| PORT | number | 5000 | Backend server port |
| NODE_ENV | string | production | Must be "production" |
| JWT_SECRET | string | 64-char hex | Cryptographically generated |
| JWT_EXPIRY | string | 24h | Token lifetime |
| FRONTEND_ORIGIN | string | https://yourdomain.com | CORS allowed origins |

### Optional Variables

| Variable | Type | Default | Notes |
|----------|------|---------|-------|
| GMAIL_USER | string | - | For email recovery |
| GMAIL_APP_PASSWORD | string | - | Gmail app password |
| SMTP_FROM | string | - | Recovery email from address |
| LOG_LEVEL | string | info | Winston log level |
| LOG_FILE | string | - | Error log file path |

---

## DEPLOYMENT VERIFICATION SCRIPT

```bash
#!/bin/bash
# verify_production_config.sh

echo "=== Production Configuration Verification ==="

# 1. Check .env exists
if [ -f backend/.env ]; then
    echo "✓ .env file exists"
else
    echo "✗ .env file missing!"
    exit 1
fi

# 2. Check JWT_SECRET is strong
JWT_SECRET=$(grep JWT_SECRET backend/.env | cut -d= -f2)
if [ ${#JWT_SECRET} -ge 32 ]; then
    echo "✓ JWT_SECRET is strong (${#JWT_SECRET} chars)"
else
    echo "✗ JWT_SECRET too weak (${#JWT_SECRET} chars, need 32+)"
    exit 1
fi

# 3. Check NODE_ENV
NODE_ENV=$(grep NODE_ENV backend/.env | cut -d= -f2)
if [ "$NODE_ENV" = "production" ]; then
    echo "✓ NODE_ENV=production"
else
    echo "✗ NODE_ENV is not production: $NODE_ENV"
    exit 1
fi

# 4. Check database connection
echo "Testing database connection..."
npm start &
PID=$!
sleep 3
if ps -p $PID > /dev/null; then
    echo "✓ Server started successfully"
    kill $PID
else
    echo "✗ Server failed to start"
    exit 1
fi

# 5. Check frontend build
echo "Building frontend..."
cd frontend
npm run build > /dev/null 2>&1
if [ -d dist ]; then
    echo "✓ Frontend build successful"
else
    echo "✗ Frontend build failed"
    exit 1
fi

echo ""
echo "=== All Checks Passed! Ready for Deployment ==="
```

---

## NEXT STEPS

1. Generate secure credentials
2. Update backend/.env with production values
3. Create frontend/.env.production
4. Configure database user and permissions
5. Run verification script
6. Deploy to production
7. Monitor logs and verify functionality

---

**Last Updated**: April 29, 2026
**Version**: 1.0
**Status**: Ready for Implementation
