# 🔧 Railway Deployment Troubleshooting

Common issues and solutions for Railway deployment failures.

---

## ❌ Issue: Health Check Failing

### Symptoms:

```
Path: /api/health/live
Retry window: 1m40s
Attempt #1 failed with service unavailable
Attempt #2 failed with service unavailable
...
1/1 replicas never became healthy!
```

### Root Cause:

The health check endpoint `/api/health/live` is not responding, causing Railway to think the app failed to start.

### Solutions:

#### 1. Verify Health Check Endpoint Exists

**Check your code has the endpoint:**

```typescript
// In src/index.ts
app.get("/api/health/live", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
```

**✅ This has been added to your codebase!**

#### 2. Rebuild and Redeploy

```bash
# Rebuild locally to verify
npm run build

# Commit and push
git add .
git commit -m "Fix health check endpoint"
git push origin main
```

Railway will automatically redeploy.

#### 3. Check Port Configuration

**Ensure your app listens on the correct port:**

```typescript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Railway automatically sets the `PORT` environment variable.

#### 4. Verify Build Completes

**Check Railway deployment logs:**

1. Go to Railway dashboard
2. Click "Deployments" tab
3. Look for build errors before health check fails

**Common build issues:**

- Missing dependencies in `package.json`
- TypeScript compilation errors
- Frontend build failures

#### 5. Check Environment Variables

**Required variables:**

- `NODE_ENV=production`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Missing variables can cause the app to crash before health checks.

#### 6. Increase Health Check Timeout

If your app takes longer to start, update `railway.json`:

```json
{
  "deploy": {
    "healthcheckTimeout": 300,
    "healthcheckPath": "/api/health/live"
  }
}
```

This gives the app 5 minutes to start (default is 100 seconds).

---

## ❌ Issue: Build Fails

### Symptoms:

```
npm ERR! Build failed
Error: Command failed
```

### Solutions:

#### 1. Check Build Command

**Verify `railway.toml` has correct build command:**

```toml
[build]
buildCommand = "npm install && npm run build && cd frontend && npm install && npm run build"
```

#### 2. Verify Package Scripts

**Check `package.json`:**

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

#### 3. Check for Missing Dependencies

**Review deployment logs for:**

```
Cannot find module 'xyz'
```

**Solution:** Add missing package:

```bash
npm install xyz
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

#### 4. Frontend Build Issues

**If frontend build fails:**

```bash
cd frontend
npm install
npm run build
```

Fix any errors locally first.

---

## ❌ Issue: App Crashes After Deployment

### Symptoms:

```
Application error
Service unavailable
```

### Solutions:

#### 1. Check Deployment Logs

**Look for error messages:**

- Click "Deployments" → "View Logs"
- Look for stack traces or error messages

#### 2. Common Crash Causes

**Missing Environment Variables:**

```
Error: CLOUDINARY_CLOUD_NAME is not defined
```

**Solution:** Add all required environment variables in Railway dashboard.

**Port Binding Issues:**

```
Error: listen EADDRINUSE
```

**Solution:** Ensure you use `process.env.PORT`:

```typescript
const PORT = process.env.PORT || 3000;
```

**Module Not Found:**

```
Cannot find module './dist/index.js'
```

**Solution:** Verify build output and start command.

#### 3. Test Locally in Production Mode

```bash
# Build
npm run build

# Run in production mode
NODE_ENV=production node dist/index.js
```

Fix any errors that appear.

---

## ❌ Issue: CORS Errors After Deployment

### Symptoms:

```
Access to fetch blocked by CORS policy
```

### Solutions:

#### 1. Add ALLOWED_ORIGINS Variable

**In Railway dashboard → Variables:**

```
ALLOWED_ORIGINS=https://your-app.up.railway.app
```

#### 2. Verify URL Format

**Correct:**

```
https://ihatepdf-production.up.railway.app
```

**Incorrect:**

```
http://ihatepdf-production.up.railway.app  ❌ (no http)
https://ihatepdf-production.up.railway.app/ ❌ (no trailing slash)
```

#### 3. Multiple Origins

**If you need multiple domains:**

```
ALLOWED_ORIGINS=https://app1.railway.app,https://app2.railway.app
```

---

## ❌ Issue: File Upload Fails

### Symptoms:

```
Error uploading file
500 Internal Server Error
```

### Solutions:

#### 1. Verify Cloudinary Credentials

**Test credentials:**

1. Go to [cloudinary.com/console](https://cloudinary.com/console)
2. Verify Cloud Name, API Key, API Secret
3. Check you haven't exceeded free tier limits

#### 2. Check Environment Variables

**All three must be set:**

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

#### 3. Review Logs for Cloudinary Errors

**Look for:**

```
Cloudinary API error
Invalid credentials
Rate limit exceeded
```

---

## ❌ Issue: Slow Response / Cold Starts

### Symptoms:

- First request takes 30+ seconds
- App seems to "wake up"

### Explanation:

Railway free tier may sleep inactive apps to conserve resources.

### Solutions:

#### 1. Accept Cold Starts (Free Tier)

This is normal behavior on free tier.

#### 2. Upgrade to Hobby Plan

$5/month for always-on service.

#### 3. Keep App Warm (Workaround)

Use a service like UptimeRobot to ping your app every 5 minutes:

```
https://your-app.up.railway.app/api/health
```

---

## ❌ Issue: Deployment Stuck

### Symptoms:

```
Building...
(stuck for 10+ minutes)
```

### Solutions:

#### 1. Cancel and Retry

**In Railway dashboard:**

1. Go to "Deployments"
2. Click "..." on stuck deployment
3. Click "Cancel"
4. Click "Redeploy"

#### 2. Check Railway Status

Visit [status.railway.app](https://status.railway.app) for platform issues.

#### 3. Simplify Build

**Temporarily remove frontend build to isolate issue:**

```toml
[build]
buildCommand = "npm install && npm run build"
```

If backend builds successfully, the issue is in frontend.

---

## 🔍 Debugging Checklist

When deployment fails, check in this order:

- [ ] **Build logs** - Does the build complete?
- [ ] **Environment variables** - Are all 5 variables set?
- [ ] **Health check endpoint** - Does `/api/health/live` exist?
- [ ] **Port configuration** - Using `process.env.PORT`?
- [ ] **Start command** - Is `node dist/index.js` correct?
- [ ] **Dependencies** - All packages in `package.json`?
- [ ] **Local build** - Does `npm run build` work locally?
- [ ] **Local production** - Does `NODE_ENV=production node dist/index.js` work?

---

## 🆘 Still Having Issues?

### 1. Check Deployment Logs Carefully

**Look for the FIRST error message** - subsequent errors are often cascading failures.

### 2. Test Locally First

```bash
# Clean install
rm -rf node_modules dist
npm install

# Build
npm run build

# Test production mode
NODE_ENV=production \
CLOUDINARY_CLOUD_NAME=your_name \
CLOUDINARY_API_KEY=your_key \
CLOUDINARY_API_SECRET=your_secret \
node dist/index.js
```

Visit `http://localhost:3000/api/health/live` - should return:

```json
{ "status": "ok", "timestamp": "2024-12-16T..." }
```

### 3. Verify Configuration Files

**Check these files exist and are correct:**

- `railway.json` - Health check configuration
- `railway.toml` - Build and deploy commands
- `package.json` - Scripts and dependencies
- `tsconfig.json` - TypeScript configuration

### 4. Railway Support

**If all else fails:**

- [Railway Discord](https://discord.gg/railway) - Very responsive community
- [Railway Documentation](https://docs.railway.app)
- [Railway Status](https://status.railway.app) - Check for outages

---

## ✅ Successful Deployment Indicators

Your deployment is successful when you see:

```
✓ Build completed
✓ Health check passed: /api/health/live
✓ Deployment live
```

**And when you test:**

- ✅ App loads at Railway URL
- ✅ `/api/health/live` returns `{"status":"ok"}`
- ✅ File upload works
- ✅ All PDF operations work
- ✅ No errors in browser console

---

## 📊 Common Error Patterns

| Error Message         | Likely Cause                | Solution                        |
| --------------------- | --------------------------- | ------------------------------- |
| `service unavailable` | Health check failing        | Add `/api/health/live` endpoint |
| `Build failed`        | Missing dependencies        | Check `package.json`            |
| `Cannot find module`  | Build output missing        | Verify build command            |
| `EADDRINUSE`          | Port conflict               | Use `process.env.PORT`          |
| `CORS error`          | Missing ALLOWED_ORIGINS     | Add environment variable        |
| `Cloudinary error`    | Invalid credentials         | Verify Cloudinary variables     |
| `Timeout`             | App takes too long to start | Increase healthcheckTimeout     |

---

## 🎯 Quick Fixes

### Fix 1: Health Check (Most Common)

```bash
# Ensure endpoint exists in src/index.ts
git add .
git commit -m "Add health check endpoint"
git push
```

### Fix 2: Environment Variables

```bash
# In Railway dashboard → Variables, add:
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
ALLOWED_ORIGINS=https://your-app.up.railway.app
```

### Fix 3: Rebuild

```bash
# In Railway dashboard:
Deployments → Latest → ... → Redeploy
```

---

**Your health check endpoint has been fixed! Push your changes and redeploy.** 🚀
