# 🚂 Railway Deployment Checklist

Use this checklist to ensure a smooth deployment to Railway.

---

## ✅ Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally: `npm test`
- [ ] Build works locally: `npm run build`
- [ ] App runs in production mode locally: `NODE_ENV=production node dist/index.js`
- [ ] Cloudinary account created (free tier)
- [ ] Cloudinary credentials ready (Cloud Name, API Key, API Secret)

---

## ✅ Railway Setup

- [ ] Railway account created (signed in with GitHub)
- [ ] New project created from GitHub repo
- [ ] Repository connected successfully
- [ ] Build started automatically

---

## ✅ Environment Variables

Add these in Railway Dashboard → Variables tab:

- [ ] `NODE_ENV=production`
- [ ] `CLOUDINARY_CLOUD_NAME=your_cloud_name`
- [ ] `CLOUDINARY_API_KEY=your_api_key`
- [ ] `CLOUDINARY_API_SECRET=your_api_secret`
- [ ] `ALLOWED_ORIGINS=https://your-app.up.railway.app` (add after getting URL)

---

## ✅ Domain Setup

- [ ] Generated Railway domain in Settings → Domains
- [ ] Copied full URL (e.g., `https://ihatepdf-production.up.railway.app`)
- [ ] Updated `ALLOWED_ORIGINS` with the Railway URL
- [ ] Waited for automatic redeploy (2-3 minutes)

---

## ✅ Deployment Verification

- [ ] Build completed successfully (check Deployments tab)
- [ ] No errors in deployment logs
- [ ] App is accessible at Railway URL
- [ ] Health check works: `https://your-app.up.railway.app/api/health/live`

---

## ✅ Feature Testing

Test each feature in production:

- [ ] Homepage loads correctly
- [ ] Upload PDF file (< 10MB)
- [ ] Compress PDF
  - [ ] Low quality
  - [ ] Medium quality
  - [ ] High quality
- [ ] Merge PDFs (upload 2+ files)
- [ ] Split PDF
  - [ ] Extract specific pages
  - [ ] Split into ranges
- [ ] Add Watermark
  - [ ] Text watermark
  - [ ] Different positions
- [ ] Download processed files
- [ ] Files are stored in Cloudinary (not Railway disk)

---

## ✅ Browser Testing

- [ ] Open browser DevTools (F12)
- [ ] Check Console tab - no errors
- [ ] Check Network tab - all API calls succeed (200 status)
- [ ] No CORS errors
- [ ] File uploads show progress
- [ ] Downloads work correctly

---

## ✅ Monitoring Setup

- [ ] Bookmarked Railway dashboard
- [ ] Checked Metrics tab for resource usage
- [ ] Reviewed initial credit consumption
- [ ] Set up notifications (optional)

---

## ✅ Post-Deployment

- [ ] Documented Railway URL
- [ ] Shared app with test users
- [ ] Monitored first few uses for errors
- [ ] Verified Cloudinary storage is working
- [ ] Checked Railway credit usage

---

## 🐛 If Something Goes Wrong

### Build Fails

1. Check deployment logs for errors
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are listed
4. Try rebuilding: Deployments → Redeploy

### App Crashes

1. Check environment variables are set correctly
2. Review deployment logs for error messages
3. Verify Cloudinary credentials
4. Check health endpoint: `/api/health/live`

### CORS Errors

1. Verify `ALLOWED_ORIGINS` matches Railway URL exactly
2. Include `https://` in the URL
3. No trailing slash
4. Wait for redeploy after changing variables

### File Upload Fails

1. Check Cloudinary credentials
2. Verify file size < 10MB
3. Check Cloudinary free tier limits
4. Review deployment logs for errors

---

## 📊 Expected Results

**Build Time:** 2-3 minutes
**Deploy Time:** 30-60 seconds
**First Request:** May take 5-10 seconds (cold start)
**Subsequent Requests:** < 1 second

**Monthly Cost (Free Tier):**

- Light use: $0-2
- Moderate use: $2-4
- Heavy use: $4-5 (may need upgrade)

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ App loads at Railway URL
✅ All PDF operations work
✅ Files upload and download correctly
✅ No errors in browser console
✅ No errors in Railway logs
✅ Health check returns 200 OK
✅ Cloudinary shows uploaded files

---

## 📝 Notes

**Railway URL:** ****************\_\_\_****************

**Deployed:** ****************\_\_\_****************

**Cloudinary Cloud Name:** ****************\_\_\_****************

**Monthly Credit Usage:** ****************\_\_\_****************

---

**Need help?** See `RAILWAY_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.
