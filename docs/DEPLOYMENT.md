# IHatePDF Deployment Guide

## 📚 Railway Deployment Resources

**For detailed Railway deployment:**

- 📖 **[RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide with troubleshooting
- ✅ **[RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md)** - Deployment checklist to ensure nothing is missed
- 🚀 **[deploy-to-railway.sh](./deploy-to-railway.sh)** - Helper script to prepare your deployment

**Quick start:**

```bash
./deploy-to-railway.sh
```

---

## 🚀 Quick Deploy Options

### Option 1: Railway.app (Recommended - Easiest)

**Cost:** $5 credit/month free tier (500 execution hours)

**Steps:**

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Sign up for Railway**

   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub
   - Authorize Railway to access your repositories

3. **Create New Project**

   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect Node.js and use `railway.toml` config

4. **Configure Environment Variables**

   - Click on your deployed service
   - Go to "Variables" tab
   - Add the following variables:

   ```
   NODE_ENV=production
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

5. **Set Up Custom Domain (Optional)**

   - Go to "Settings" tab
   - Under "Domains", Railway provides a free subdomain: `your-app.up.railway.app`
   - Or add your custom domain

6. **Update CORS Settings**

   - After deployment, note your Railway URL
   - Add another environment variable:

   ```
   ALLOWED_ORIGINS=https://your-app.up.railway.app
   ```

   - Railway will automatically redeploy

7. **Monitor Deployment**
   - Check "Deployments" tab for build logs
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-app.up.railway.app`

**Railway Configuration Files:**

- `railway.json` - Build and deploy settings
- `railway.toml` - Service configuration (already in your repo)

**Important Notes:**

- ✅ Railway auto-detects Node.js and

---

### Option 2: Render.com

**Cost:** Free tier available

**Steps:**

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Render will use `render.yaml` configuration
6. Add environment variables (especially Cloudinary credentials)
7. Deploy!

**Free Tier Limitations:**

- Spins down after 15 minutes of inactivity
- Cold start takes 30-60 seconds
- 750 hours/month free

---

### Option 3: Fly.io

**Cost:** Generous free tier (requires credit card)

**Steps:**

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `flyctl auth login`
3. Launch app: `flyctl launch`
4. Follow prompts to configure
5. Deploy: `flyctl deploy`

**Create `fly.toml`:**

```toml
app = "ihatepdf"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[mounts]
  source = "uploads_volume"
  destination = "/app/uploads"
```

---

### ⚠️ Option 4: Vercel (Requires Major Changes)

**Cost:** Free tier available

**Issues:**

- 10-second serverless function timeout
- No persistent file storage
- Not ideal for this app

**Required Changes:**

1. **Must use Cloudinary** for all storage (no local files)
2. **Split operations** into smaller chunks
3. **Use Vercel Blob** for temporary storage (paid feature)
4. **Rewrite as serverless functions**

**Not recommended** unless you're willing to refactor significantly.

---

## 📋 Pre-Deployment Checklist

### 1. Set Up Cloudinary (Recommended for all platforms)

```bash
# Sign up at https://cloudinary.com (free tier: 25GB storage, 25GB bandwidth)
# Get credentials from dashboard
# Add to your deployment platform's environment variables:
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Update CORS Origins

In your deployment platform, set:

```bash
ALLOWED_ORIGINS=https://your-actual-domain.com
```

### 3. Test Locally First

```bash
# Build and test
npm run build
cd frontend && npm run build && cd ..

# Run production build locally
NODE_ENV=production node dist/index.js
```

---

## 🎯 Recommended: Railway + Cloudinary

**Why this combo?**

- ✅ Railway handles the app hosting
- ✅ Cloudinary handles file storage
- ✅ No disk space concerns
- ✅ Automatic CDN for file downloads
- ✅ Easy to scale
- ✅ $5/month is very affordable

**Total Cost:** ~$5-10/month for moderate usage

---

## 🆓 Completely Free Option: Render + Cloudinary Free Tiers

**Setup:**

1. Deploy to Render.com (free tier)
2. Use Cloudinary free tier for storage
3. Accept cold starts (app sleeps after 15 min inactivity)

**Limitations:**

- Cold starts (30-60 seconds to wake up)
- 750 hours/month (enough for side projects)
- Cloudinary free tier: 25GB storage, 25GB bandwidth/month

**Good for:** Personal projects, portfolios, low-traffic apps

---

## 🔧 Platform-Specific Tips

### Railway

- Add a volume for `/app/uploads` if not using Cloudinary
- Set `RAILWAY_VOLUME_MOUNT_PATH=/app/uploads`
- Monitor usage in dashboard

### Render

- Use the persistent disk feature (configured in `render.yaml`)
- Free tier includes 1GB disk
- Set up health checks: `/api/health/live`

### Fly.io

- Create a volume: `flyctl volumes create uploads_volume --size 1`
- Mount it in `fly.toml`
- Scale as needed: `flyctl scale count 2`

---

## 📊 Cost Comparison

| Platform | Free Tier       | Paid Tier   | Best For               |
| -------- | --------------- | ----------- | ---------------------- |
| Railway  | $5 credit/month | $5-20/month | Active projects        |
| Render   | 750 hrs/month   | $7/month    | Side projects          |
| Fly.io   | Generous free   | $5-15/month | Scalable apps          |
| Vercel   | Yes             | $20/month   | Not ideal for this app |

---

## 🚀 Quick Start: Deploy to Railway Now

```bash
# 1. Push to GitHub
git push origin master

# 2. Go to railway.app and sign in with GitHub

# 3. Click "New Project" → "Deploy from GitHub repo"

# 4. Select your repo

# 5. Add environment variables (click on your service → Variables):
#    - CLOUDINARY_CLOUD_NAME
#    - CLOUDINARY_API_KEY
#    - CLOUDINARY_API_SECRET
#    - NODE_ENV=production

# 6. Done! Your app will be live in 2-3 minutes
```

---

## ✅ Your App is Ready!

The codebase is production-ready and can be deployed to any of these platforms. Railway is the easiest and most suitable for your needs.

**Next Steps:**

1. Choose a platform (Railway recommended)
2. Set up Cloudinary account (free tier is fine)
3. Deploy following the steps above
4. Test all features in production
5. Share your app! 🎉
