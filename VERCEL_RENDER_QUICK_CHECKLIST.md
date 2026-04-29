# VERCEL + RENDER DEPLOYMENT - QUICK REFERENCE CHECKLIST

**Print this page and check off items as you go!**

---

## ☐ PHASE 1: PREPARE CODE (30 min)

### Backend Preparation
- [ ] Create `Procfile` in `backend/`
- [ ] Update `package.json` with node version
- [ ] Create `.env.production` template
- [ ] Verify `server.js` uses `process.env.PORT`
- [ ] Test locally: `npm start`

### Frontend Preparation
- [ ] Verify `vite.config.js` configured correctly
- [ ] Create `vercel.json`
- [ ] Create `.env.production`
- [ ] Test build locally: `npm run build`
- [ ] Verify `dist/` folder created

### Push to GitHub
- [ ] Add all new files: `git add`
- [ ] Commit: `git commit -m "Add deployment config"`
- [ ] Push: `git push origin main`

---

## ☐ PHASE 2: SETUP DATABASE (45 min)

### Choose Provider
- [ ] Decision: Railway OR PlanetScale?
- [ ] Create account with GitHub

### Create Database
- [ ] Create new database service
- [ ] Get connection details:
  - [ ] Host: ___________________
  - [ ] Port: ___________________
  - [ ] User: ___________________
  - [ ] Password: ___________________
  - [ ] Database: ___________________

### Import Schema
- [ ] Export schema from local MySQL
- [ ] Import to cloud database
- [ ] Verify tables exist: `SHOW TABLES;`
- [ ] Test connection works

### Create Production User
- [ ] Create limited-permission user
- [ ] Grant only necessary privileges
- [ ] Test user can connect
- [ ] Save credentials securely

---

## ☐ PHASE 3: DEPLOY BACKEND ON RENDER (20 min)

### Create Render Account
- [ ] Sign up at render.com
- [ ] Authorize GitHub access
- [ ] Link RVCO5-27/SHS repository

### Configure Service
- [ ] Create new Web Service
- [ ] Name: `shs-portal-backend`
- [ ] Root Directory: `cid-shs-portal/backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Region selected: ___________________

### Add Environment Variables (CRITICAL!)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`
- [ ] `DB_HOST` = ___________________
- [ ] `DB_USER` = ___________________
- [ ] `DB_PASS` = ___________________
- [ ] `DB_NAME` = `shs_production`
- [ ] `JWT_SECRET` = ___________________
- [ ] `FRONTEND_ORIGIN` = (will add after Vercel)
- [ ] `GMAIL_USER` = ___________________
- [ ] `GMAIL_APP_PASSWORD` = ___________________

### Deploy
- [ ] Click "Deploy"
- [ ] Monitor build process
- [ ] Wait for "Deployment live"
- [ ] Get backend URL: ___________________
- [ ] Test: `curl https://<url>/api/ping`
- [ ] Expected response: `{"status":"ok"}`

---

## ☐ PHASE 4: DEPLOY FRONTEND ON VERCEL (20 min)

### Create Vercel Account
- [ ] Sign up at vercel.com
- [ ] Authorize GitHub access
- [ ] Import RVCO5-27/SHS repository

### Configure Project
- [ ] Project Name: `shs-portal-frontend`
- [ ] Root Directory: `cid-shs-portal/frontend`
- [ ] Framework: `Vite`
- [ ] Node Version: `18.x`

### Add Environment Variables
- [ ] `VITE_API_URL` = `https://<render-backend-url>/api`
- [ ] `VITE_APP_NAME` = `SHS Portal`
- [ ] Set for: Production + Preview

### Deploy
- [ ] Click "Deploy"
- [ ] Monitor build logs
- [ ] Wait for "Deployment complete"
- [ ] Get frontend URL: ___________________
- [ ] Visit URL in browser
- [ ] Verify page loads

---

## ☐ PHASE 5: CONFIGURE CORS (30 min)

### Update Backend CORS
- [ ] Edit `server.js` CORS section
- [ ] Test CORS locally: `npm run dev`
- [ ] Verify `cors` package installed

### Update Render Environment
- [ ] In Render Dashboard
- [ ] Add: `FRONTEND_ORIGIN` = (Vercel URL)
- [ ] Format: `https://shs-portal.vercel.app`
- [ ] Save and note "Redeploy" required

### Redeploy Backend
- [ ] In Render Dashboard
- [ ] Click "Redeploy"
- [ ] Monitor logs for errors
- [ ] Wait for "Deployment live"
- [ ] Verify: No CORS errors in logs

### Test CORS Connection
- [ ] In browser console on Vercel frontend:
  ```javascript
  fetch('https://<backend-url>/api/ping', {
    method: 'GET',
    credentials: 'include',
    headers: {'Content-Type': 'application/json'}
  })
  .then(r => r.json())
  .then(d => console.log('Success:', d))
  .catch(e => console.error('Error:', e))
  ```
- [ ] Should see: `Success: {status: 'ok'}`
- [ ] No CORS error

---

## ☐ PHASE 6: VERIFY ENVIRONMENT VARIABLES (15 min)

### Backend (Render)
- [ ] NODE_ENV = production
- [ ] PORT = 3000
- [ ] DB_HOST = set and correct
- [ ] DB_USER = set and correct
- [ ] DB_PASS = set and correct
- [ ] DB_NAME = shs_production
- [ ] JWT_SECRET = 64+ characters
- [ ] FRONTEND_ORIGIN = exact Vercel URL
- [ ] GMAIL_USER = set
- [ ] GMAIL_APP_PASSWORD = set

### Frontend (Vercel)
- [ ] VITE_API_URL = https://<render-url>/api
- [ ] VITE_APP_NAME = set
- [ ] Deployed to Production environment

### Database Connection
- [ ] Test connection from local machine
- [ ] Verify user permissions working
- [ ] Check schema imported correctly

---

## ☐ PHASE 7: TESTING (60 min)

### Frontend Tests
- [ ] [ ] Frontend loads without errors
- [ ] [ ] No console errors (F12)
- [ ] [ ] All pages render
- [ ] [ ] CSS/styles applied
- [ ] [ ] Navigation works
- [ ] [ ] Responsive on mobile

### Backend Health
- [ ] GET `/api/ping` returns ok
- [ ] Logs show successful startup
- [ ] Database connection confirmed in logs

### Authentication Tests
- [ ] [ ] Can access login page
- [ ] [ ] Login with correct credentials succeeds
- [ ] [ ] JWT token created and stored
- [ ] [ ] Redirected to dashboard
- [ ] [ ] Logout works and clears token
- [ ] [ ] Cannot access protected pages without token

### Data Operations
- [ ] [ ] Can list issuances
- [ ] [ ] Can create new issuance
- [ ] [ ] Can edit issuance
- [ ] [ ] Can delete issuance
- [ ] [ ] Changes persist after reload

### File Upload
- [ ] [ ] Can upload files
- [ ] [ ] File stored on backend
- [ ] [ ] Can download/access uploaded files

### Error Handling
- [ ] [ ] Invalid login shows error (no system details exposed)
- [ ] [ ] Network errors handled gracefully
- [ ] [ ] Database errors show friendly message
- [ ] [ ] CORS errors resolved

### Performance
- [ ] [ ] Home page loads < 3 seconds
- [ ] [ ] API endpoints respond < 1 second
- [ ] [ ] Bundle size acceptable in build logs

### Security
- [ ] [ ] HTTPS on frontend
- [ ] [ ] HTTPS on backend
- [ ] [ ] Padlock in browser
- [ ] [ ] SSL certificate valid

---

## ☐ PHASE 8: SMOKE TEST (5 min)

Quick validation that everything works:

1. [ ] Open: https://shs-portal.vercel.app
2. [ ] Page loads without errors
3. [ ] Click Login
4. [ ] Enter admin credentials
5. [ ] Login succeeds
6. [ ] Redirected to dashboard
7. [ ] Can navigate to main feature
8. [ ] Can view data from backend
9. [ ] Click Logout
10. [ ] Redirected to login page

**If all 10 pass ✅ → System is READY!**

---

## ☐ PHASE 9: SETUP MONITORING

### Render Backend Monitoring
- [ ] Setup email notifications for crashes
- [ ] Enable auto-deployment on git push
- [ ] Save logs for troubleshooting

### Database Monitoring (Railway/PlanetScale)
- [ ] Monitor storage usage
- [ ] Enable backups
- [ ] Setup connection alerts

### Vercel Frontend Monitoring
- [ ] Enable error reporting
- [ ] Setup deployment notifications
- [ ] Monitor build times

---

## ☐ FINAL VERIFICATION

### URLs Are Correct
- Frontend: https://shs-portal.vercel.app ✓
- Backend: https://shs-portal-backend.onrender.com ✓
- Database: Railway/PlanetScale ✓

### Credentials Are Secure
- [ ] No secrets in source code
- [ ] .env not in git
- [ ] All sensitive data in environment variables
- [ ] JWT_SECRET is unique and strong
- [ ] Database password is strong

### Team Is Ready
- [ ] Team knows production URLs
- [ ] Team knows how to access logs
- [ ] Team knows rollback procedure
- [ ] Backups configured
- [ ] Monitoring active

### Deployment Is Complete
- [ ] Frontend deployed and live
- [ ] Backend deployed and live
- [ ] Database configured and ready
- [ ] CORS working
- [ ] API connection established
- [ ] All features tested and working

---

## 🎉 DEPLOYMENT COMPLETE!

**Checklist Completed**: Date ________________  
**Completed By**: ________________________  
**Verified By**: ________________________  

### Production URLs (Save These)
```
Frontend: https://shs-portal.vercel.app
Backend: https://shs-portal-backend.onrender.com
Database: [Your database connection string]

Admin Username: admin
Admin Password: [your-password]
```

### Next Steps
1. Monitor logs for first 24 hours
2. Collect user feedback
3. Document any issues
4. Plan improvements
5. Schedule regular backups
6. Monitor performance metrics

---

## 🆘 IF SOMETHING GOES WRONG

### CORS Error?
→ Go to TROUBLESHOOTING section in main guide

### Backend Down?
→ Check Render logs in dashboard

### Frontend Not Loading?
→ Check Vercel deployment logs

### Database Connection Failed?
→ Verify credentials in Render environment

### Need Quick Help?
→ Search TROUBLESHOOTING section in main guide

---

**This checklist is your deployment roadmap!**

**Keep it handy throughout the process.**

**✅ Check each box as you complete it.**

**🎯 When all boxes are checked, you're done!**

---

**Questions?** See: VERCEL_RENDER_DEPLOYMENT_GUIDE.md

**Need help?** Check the TROUBLESHOOTING section

**Ready to start?** Begin with PHASE 1!
