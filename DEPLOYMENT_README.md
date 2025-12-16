# 📦 Deployment Documentation

Complete guide to deploying IHatePDF to various platforms.

---

## 📚 Documentation Files

### 🚂 Railway (Recommended)

| File                                                             | Purpose                     | When to Use                             |
| ---------------------------------------------------------------- | --------------------------- | --------------------------------------- |
| **[RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md)**           | 5-minute quick deploy       | First-time deployment                   |
| **[RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)** | Complete step-by-step guide | Detailed instructions & troubleshooting |
| **[RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md)**               | Deployment checklist        | Ensure nothing is missed                |
| **[deploy-to-railway.sh](./deploy-to-railway.sh)**               | Automated helper script     | Quick preparation                       |

### 🌐 All Platforms

| File                                             | Purpose                            |
| ------------------------------------------------ | ---------------------------------- |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)**             | Overview of all deployment options |
| **[CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)** | Cloudinary configuration guide     |

---

## 🚀 Quick Start

### Option 1: Automated Script (Easiest)

```bash
# Make script executable (first time only)
chmod +x deploy-to-railway.sh

# Run the deployment helper
./deploy-to-railway.sh
```

Then follow the Railway setup instructions.

### Option 2: Manual (5 minutes)

1. **Read:** [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md)
2. **Deploy:** Follow the 3-step process
3. **Verify:** Use [RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md)

---

## 🎯 Deployment Paths

### For Beginners

```
1. RAILWAY_QUICK_START.md (5 min read)
2. deploy-to-railway.sh (run script)
3. RAILWAY_CHECKLIST.md (verify deployment)
```

### For Detailed Setup

```
1. RAILWAY_DEPLOYMENT_GUIDE.md (complete guide)
2. CLOUDINARY_SETUP.md (storage setup)
3. RAILWAY_CHECKLIST.md (verification)
```

### For Other Platforms

```
1. DEPLOYMENT.md (compare options)
2. Choose platform
3. Follow platform-specific instructions
```

---

## 📋 Pre-Deployment Requirements

Before deploying to any platform:

- [ ] GitHub account
- [ ] Code pushed to GitHub
- [ ] Cloudinary account (free tier)
- [ ] Tests passing: `npm test`
- [ ] Build working: `npm run build`

---

## 🌟 Recommended: Railway + Cloudinary

**Why this combination?**

✅ **Railway** - Easy deployment, auto-scaling, $5/month free tier
✅ **Cloudinary** - File storage, CDN, 25GB free tier
✅ **Total cost:** $0-5/month for moderate usage

**Setup time:** 5-10 minutes

---

## 🔧 Configuration Files

Your repository includes these pre-configured files:

| File           | Purpose                        |
| -------------- | ------------------------------ |
| `railway.json` | Railway build & deploy config  |
| `railway.toml` | Railway service configuration  |
| `render.yaml`  | Render.com configuration       |
| `Dockerfile`   | Docker containerization        |
| `.env.example` | Environment variables template |

**No additional configuration needed!** Just add your environment variables.

---

## 🎓 Platform Comparison

| Platform    | Free Tier       | Best For        | Setup Time |
| ----------- | --------------- | --------------- | ---------- |
| **Railway** | $5 credit/month | Active projects | 5 min      |
| **Render**  | 750 hrs/month   | Side projects   | 10 min     |
| **Fly.io**  | Generous free   | Scalable apps   | 15 min     |
| **Vercel**  | Yes             | Frontend only   | Not ideal  |

**Recommendation:** Start with Railway for easiest setup.

---

## 📊 Cost Estimates

### Railway (Recommended)

- **Free tier:** $5 credit/month (~500 hours)
- **Light use:** $0-2/month
- **Moderate use:** $2-4/month
- **Heavy use:** $5-8/month

### Cloudinary (File Storage)

- **Free tier:** 25GB storage, 25GB bandwidth/month
- **Typical usage:** Well within free tier
- **Upgrade:** $89/month (only if you exceed free tier)

### Total Monthly Cost

- **Personal project:** $0-2
- **Small business:** $5-10
- **Growing app:** $10-20

---

## ✅ Deployment Checklist

Use this quick checklist for any platform:

- [ ] Code committed and pushed to GitHub
- [ ] Tests passing locally
- [ ] Build successful locally
- [ ] Cloudinary account created
- [ ] Environment variables ready
- [ ] Platform account created
- [ ] Repository connected
- [ ] Environment variables configured
- [ ] Domain generated/configured
- [ ] CORS settings updated
- [ ] Deployment successful
- [ ] All features tested in production

**Detailed checklist:** [RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md)

---

## 🐛 Troubleshooting

### Build Fails

1. Check deployment logs
2. Verify `package.json` scripts
3. Ensure all dependencies listed
4. See: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md#issue-build-fails)

### App Crashes

1. Verify environment variables
2. Check Cloudinary credentials
3. Review deployment logs
4. See: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md#issue-app-crashes-on-start)

### CORS Errors

1. Check `ALLOWED_ORIGINS` variable
2. Verify URL format (include `https://`)
3. No trailing slash
4. See: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md#issue-cors-errors)

### File Upload Fails

1. Verify Cloudinary credentials
2. Check file size limits
3. Review Cloudinary dashboard
4. See: [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md#issue-file-upload-fails)

---

## 🆘 Getting Help

### Railway Issues

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### Cloudinary Issues

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Support](https://support.cloudinary.com)
- [Cloudinary Status](https://status.cloudinary.com)

### App Issues

- Check deployment logs
- Review browser console
- See troubleshooting guides above

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ App loads at deployment URL
✅ All PDF operations work (compress, merge, split, watermark)
✅ Files upload and download correctly
✅ No errors in browser console
✅ No errors in deployment logs
✅ Health check endpoint responds: `/api/health/live`
✅ Cloudinary shows uploaded files
✅ CORS configured correctly

---

## 📖 Next Steps After Deployment

1. **Test thoroughly** - Try all features in production
2. **Monitor usage** - Check platform dashboard regularly
3. **Set up custom domain** - Optional but professional
4. **Share your app** - Get user feedback
5. **Monitor costs** - Stay within free tier or budget
6. **Plan scaling** - Upgrade when needed

---

## 🚀 Ready to Deploy?

### Quick Path (5 minutes)

```bash
./deploy-to-railway.sh
```

### Detailed Path (10 minutes)

1. Read [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md)
2. Follow step-by-step instructions
3. Use [RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md) to verify

---

## 📝 Documentation Updates

This documentation is maintained alongside the codebase. If you find issues or have suggestions:

1. Check existing documentation first
2. Review troubleshooting sections
3. Update documentation if you solve a new issue
4. Share improvements with the community

---

**Happy Deploying! 🚀**

_Last updated: December 2024_
