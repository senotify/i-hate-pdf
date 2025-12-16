# 🚂 Railway Deployment Guide - Step by Step

This guide walks you through deploying IHatePDF to Railway.app with detailed instructions and troubleshooting.

---

## 📋 Prerequisites

Before you start:

- [ ] GitHub account
- [ ] Code pushed to GitHub repository
- [ ] Cloudinary account (free tier is fine)
- [ ] Railway account (sign up with GitHub)

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for Railway deployment"

# Push to GitHub (main or master branch)
git push origin main
```

### Step 2: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click "Login" in the top right
3. Select "Login with GitHub"
4. Authorize Railway to access your repositories
5. Complete the signup process

**Free Tier Details:**

- $5 in free credits per month
- ~500 execution hours
- No credit card required to start

---

### Step 3: Create New Project

1. **From Railway Dashboard:**

   - Click "New Project" button
   - Select "Deploy from GitHub repo"

2. **Select Repository:**

   - You'll see a list of your GitHub repos
   - Find and click on your `ihatepdf` repository
   - Railway will start analyzing your code

3. **Automatic Detection:**
   - Railway detects Node.js automatically
   - It will use your `railway.toml` and `railway.json` configs
   - Build process starts immediately

---

### Step 4: Configure Environment Variables

**Critical:** Your app won't work without these variables!

1. **Navigate to Variables:**

   - Click on your deployed service card
   - Click the "Variables" tab

2. **Add Required Variables:**

   Click "New Variable" for each:

   ```bash
   NODE_ENV=production
   ```

   ```bash
   CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
   ```

   ```bash
   CLOUDINARY_API_KEY=your_actual_api_key
   ```

   ```bash
   CLOUDINARY_API_SECRET=your_actual_api_secret
   ```

3. **Get Cloudinary Credentials:**

   - Go to [cloudinary.com/console](https://cloudinary.com/console)
   - Sign up for free account if you haven't
   - Copy credentials from dashboard:
     - Cloud Name
     - API Key
     - API Secret

4. **Save Variables:**
   - Railway auto-saves each variable
   - A new deployment will trigger automatically

---

### Step 5: Get Your App URL

1. **Generate Public URL:**

   - Go to "Settings" tab
   - Scroll to "Domains" section
   - Click "Generate Domain"
   - Railway creates: `your-app-name.up.railway.app`

2. **Copy Your URL:**
   - Copy the full URL (e.g., `https://ihatepdf-production.up.railway.app`)

---

### Step 6: Update CORS Settings

**Important:** Without this, your frontend won't connect to backend!

1. **Add ALLOWED_ORIGINS Variable:**

   - Go back to "Variables" tab
   - Click "New Variable"
   - Add:

   ```bash
   ALLOWED_ORIGINS=https://your-app-name.up.railway.app
   ```

   - Replace with your actual Railway URL from Step 5

2. **Redeploy:**
   - Railway automatically redeploys when you add variables
   - Wait 2-3 minutes for deployment to complete

---

### Step 7: Monitor Deployment

1. **Check Build Logs:**

   - Click "Deployments" tab
   - Click on the latest deployment
   - Watch the build logs in real-time

2. **Look for Success Messages:**

   ```
   ✓ Build completed successfully
   ✓ Deployment live
   ```

3. **Common Build Output:**
   ```bash
   npm install
   npm run build
   Compiling TypeScript...
   Building frontend...
   ✓ Build successful
   Starting server...
   Server running on port 3000
   ```

---

### Step 8: Test Your Deployment

1. **Open Your App:**

   - Click the generated domain URL
   - Or visit: `https://your-app-name.up.railway.app`

2. **Test Core Features:**

   - [ ] Upload a PDF
   - [ ] Compress a PDF
   - [ ] Merge PDFs
   - [ ] Split a PDF
   - [ ] Add watermark
   - [ ] Download results

3. **Check Browser Console:**
   - Press F12 to open DevTools
   - Look for any errors in Console tab
   - Network tab should show successful API calls

---

## 🔧 Configuration Files Explained

Your repo already has these files configured:

### `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

**What it does:**

- Uses NIXPACKS builder (auto-detects Node.js)
- Runs `npm start` to launch your app
- Health checks at `/api/health` endpoint

### `railway.toml`

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health/live"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**What it does:**

- Configures build and deployment
- Sets up health checks
- Auto-restart on failures (up to 10 retries)

---

## 📊 Monitoring Your App

### View Logs

1. **Real-time Logs:**

   - Click "Deployments" tab
   - Click "View Logs" on active deployment
   - See live server output

2. **What to Look For:**
   ```
   ✓ Server started on port 3000
   ✓ Connected to Cloudinary
   ✓ Health check passed
   ```

### Check Metrics

1. **Usage Dashboard:**

   - Click "Metrics" tab
   - View CPU, Memory, Network usage
   - Monitor your $5 credit consumption

2. **Typical Usage:**
   - Idle: ~$0.50/day
   - Moderate use: ~$2-3/month
   - Heavy use: ~$5-8/month

---

## 🐛 Troubleshooting

**📖 For detailed troubleshooting, see [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md)**

### Issue: Build Fails

**Symptoms:**

```
npm ERR! Build failed
```

**Solutions:**

1. Check `package.json` has correct scripts:

   ```json
   "scripts": {
     "build": "tsc && cd frontend && npm install && npm run build",
     "start": "node dist/index.js"
   }
   ```

2. Verify all dependencies are in `package.json`

3. Check build logs for specific errors

---

### Issue: App Crashes on Start

**Symptoms:**

```
Application failed to respond
```

**Solutions:**

1. **Check Environment Variables:**

   - Verify all 4 required variables are set
   - No typos in variable names
   - Cloudinary credentials are correct

2. **Check Logs:**

   - Look for error messages in deployment logs
   - Common: "Cannot find module" = missing dependency

3. **Verify Port Configuration:**
   - Railway automatically sets `PORT` variable
   - Your app should use `process.env.PORT || 3000`

---

### Issue: CORS Errors

**Symptoms:**

```
Access to fetch blocked by CORS policy
```

**Solutions:**

1. **Add ALLOWED_ORIGINS:**

   ```bash
   ALLOWED_ORIGINS=https://your-app.up.railway.app
   ```

2. **Check URL Format:**

   - Must include `https://`
   - No trailing slash
   - Exact match to your Railway domain

3. **Multiple Origins (if needed):**
   ```bash
   ALLOWED_ORIGINS=https://app1.railway.app,https://app2.railway.app
   ```

---

### Issue: File Upload Fails

**Symptoms:**

```
Error uploading file
500 Internal Server Error
```

**Solutions:**

1. **Verify Cloudinary Setup:**

   - Check all 3 Cloudinary variables are set
   - Test credentials at cloudinary.com
   - Ensure free tier limits not exceeded

2. **Check File Size:**

   - Railway has request size limits
   - Your app limits files to 10MB (configurable)

3. **Review Logs:**
   - Look for Cloudinary API errors
   - Check for timeout issues

---

### Issue: App Sleeps/Slow Response

**Symptoms:**

- First request takes 30+ seconds
- App seems to "wake up"

**Solution:**

- This is normal on free tier
- Railway may sleep inactive apps
- Upgrade to Hobby plan ($5/month) for always-on

---

## 🎯 Custom Domain Setup (Optional)

### Add Your Own Domain

1. **In Railway:**

   - Go to "Settings" → "Domains"
   - Click "Custom Domain"
   - Enter your domain: `ihatepdf.com`

2. **In Your DNS Provider:**

   - Add CNAME record:

   ```
   Type: CNAME
   Name: @ (or subdomain)
   Value: your-app.up.railway.app
   ```

3. **Update CORS:**

   - Update `ALLOWED_ORIGINS` to your custom domain

   ```bash
   ALLOWED_ORIGINS=https://ihatepdf.com
   ```

4. **Wait for DNS:**
   - Can take 5 minutes to 48 hours
   - Railway auto-provisions SSL certificate

---

## 💰 Cost Management

### Monitor Usage

1. **Check Credit Balance:**

   - Dashboard shows remaining credits
   - Resets monthly

2. **Optimize Costs:**
   - Use Cloudinary for file storage (not Railway disk)
   - Set up auto-cleanup for temp files
   - Monitor CPU/memory usage

### Free Tier Limits

- **$5 credit/month** = ~500 execution hours
- **Typical usage:** 2-4 hours/day = $2-4/month
- **Heavy usage:** May need Hobby plan ($5/month)

### Upgrade Options

**Hobby Plan ($5/month):**

- $5 included usage
- Pay-as-you-go beyond that
- Priority support
- Better performance

---

## 🔄 Continuous Deployment

### Automatic Deploys

Railway automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Railway detects push and deploys automatically
# Check "Deployments" tab to monitor
```

### Rollback

If a deployment breaks:

1. Go to "Deployments" tab
2. Find previous working deployment
3. Click "⋯" menu → "Redeploy"
4. Instant rollback to that version

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] All environment variables set
- [ ] App loads at Railway URL
- [ ] File upload works
- [ ] PDF operations work (compress, merge, split, watermark)
- [ ] Files download correctly
- [ ] No CORS errors in browser console
- [ ] Health check endpoint responds: `/api/health/live`
- [ ] Cloudinary storage working
- [ ] Logs show no errors

---

## 🎉 Success!

Your app is now live on Railway!

**Your URLs:**

- App: `https://your-app.up.railway.app`
- Health Check: `https://your-app.up.railway.app/api/health/live`
- API: `https://your-app.up.railway.app/api/*`

**Next Steps:**

1. Share your app with users
2. Monitor usage in Railway dashboard
3. Set up custom domain (optional)
4. Consider upgrading if you exceed free tier

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord Community](https://discord.gg/railway)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Your App's Health Check](https://your-app.up.railway.app/api/health/live)

---

## 🆘 Need Help?

**Railway Issues:**

- Check [Railway Status](https://status.railway.app)
- Join [Railway Discord](https://discord.gg/railway)
- Email: team@railway.app

**App Issues:**

- Check deployment logs in Railway
- Review browser console for errors
- Verify environment variables

**Cloudinary Issues:**

- Check [Cloudinary Status](https://status.cloudinary.com)
- Review [Cloudinary Docs](https://cloudinary.com/documentation)
- Check your usage limits

---

**Happy Deploying! 🚀**
