# 🚂 Railway Quick Start - 5 Minutes to Deploy

The fastest way to get your IHatePDF app live on Railway.

---

## ⚡ Super Quick Deploy (5 minutes)

### 1. Prepare (1 minute)

```bash
# Run the helper script
./deploy-to-railway.sh

# Or manually:
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy (2 minutes)

1. Go to [railway.app](https://railway.app) → Login with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Wait for build to complete

### 3. Configure (2 minutes)

**Add Environment Variables** (click your service → Variables tab):

```bash
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Get Cloudinary credentials:**

- Sign up at [cloudinary.com](https://cloudinary.com) (free)
- Copy from dashboard

**Generate Domain:**

- Settings → Domains → Generate Domain
- Copy your URL: `https://your-app.up.railway.app`

**Add CORS:**

- Variables → New Variable:

```bash
ALLOWED_ORIGINS=https://your-app.up.railway.app
```

### 4. Test

Visit your Railway URL and test:

- ✅ Upload a PDF
- ✅ Compress it
- ✅ Download result

---

## 🎯 That's It!

Your app is live! 🎉

**What you get:**

- ✅ Free $5 credit/month (~500 hours)
- ✅ Automatic HTTPS
- ✅ Auto-deploy on git push
- ✅ Built-in monitoring

---

## 📚 Need More Help?

- **Detailed guide:** [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
- **Checklist:** [RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md)
- **All options:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🐛 Common Issues

**Build fails?**

- Check deployment logs in Railway
- Verify `package.json` has `build` and `start` scripts

**App crashes?**

- Verify all 5 environment variables are set
- Check Cloudinary credentials are correct

**CORS errors?**

- Ensure `ALLOWED_ORIGINS` matches your Railway URL exactly
- Include `https://` and no trailing slash

**File upload fails?**

- Verify Cloudinary credentials
- Check file size < 10MB

---

## 💡 Pro Tips

1. **Bookmark your Railway dashboard** for easy access
2. **Monitor your credit usage** in the Metrics tab
3. **Set up custom domain** in Settings → Domains (optional)
4. **Auto-deploys** happen on every git push to main branch
5. **Rollback** anytime from Deployments tab

---

## 🚀 Deploy Now

```bash
./deploy-to-railway.sh
```

Then follow the prompts!

---

**Questions?** Check the [full deployment guide](./RAILWAY_DEPLOYMENT_GUIDE.md) or Railway's [documentation](https://docs.railway.app).
