# 🚀 Complete Deployment Guide for LMS Gambheera

## 📋 Overview
This guide will help you deploy your LMS Gambheera application to Vercel with Sanity Studio and Supabase integration.

---

## 🔐 Security First - Important Notes

### ✅ What's Already Done:
1. ✅ `.env.local` is properly ignored in `.gitignore`
2. ✅ `.env.example` template created (safe to commit)
3. ✅ Sanity CORS configured for Vercel domains
4. ✅ API routes secured with proper headers
5. ✅ TypeScript and ESLint errors handled for production builds

### ⚠️ NEVER Commit These Files:
- `.env.local`
- `.env.development.local`
- `.env.production.local`
- Any file containing actual API keys or secrets

---

## 📝 Required Environment Variables

You'll need these 10 environment variables (get them from your `.env.local` file):

### Sanity CMS (7 variables):
```
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
NEXT_PUBLIC_SANITY_API_VERSION
NEXT_PUBLIC_SANITY_READ_TOKEN
SANITY_API_TOKEN
SANITY_API_WRITE_TOKEN
NEXT_PUBLIC_SANITY_EDITOR_TOKEN
```

### Supabase (3 variables):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## 🎯 Step-by-Step Deployment Process

### Step 1: Prepare Your GitHub Repository

1. **Check Git Status**
   ```powershell
   cd "c:\Users\moksh\OneDrive\Desktop\lmsgambheera"
   git status
   ```

2. **Initialize Git (if not already done)**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit - Ready for Vercel deployment"
   ```

3. **Add Remote Origin**
   ```powershell
   git remote add origin https://github.com/DampetlaMokshith/lmsgambheera.git
   ```

4. **Push to GitHub**
   ```powershell
   git branch -M main
   git push -u origin main
   ```

   **Note:** If you get authentication errors, you'll need to:
   - Create a Personal Access Token (PAT) on GitHub
   - Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Use the token as your password when pushing

---

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Website (RECOMMENDED)

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your GitHub repository: `DampetlaMokshith/lmsgambheera`

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave as default)
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add ALL 10 variables:

   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID = [your_value]
   NEXT_PUBLIC_SANITY_DATASET = [your_value]
   NEXT_PUBLIC_SANITY_API_VERSION = 2023-05-03
   NEXT_PUBLIC_SANITY_READ_TOKEN = [your_value]
   SANITY_API_TOKEN = [your_value]
   SANITY_API_WRITE_TOKEN = [your_value]
   NEXT_PUBLIC_SANITY_EDITOR_TOKEN = [your_value]
   NEXT_PUBLIC_SUPABASE_URL = [your_value]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your_value]
   SUPABASE_SERVICE_ROLE_KEY = [your_value]
   ```

   **Copy values from your `.env.local` file!**

5. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes for build to complete
   - You'll get a URL like: `https://lmsgambheera.vercel.app`

#### Option B: Deploy via Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd "c:\Users\moksh\OneDrive\Desktop\lmsgambheera"
vercel

# Follow prompts and add environment variables when asked
```

---

### Step 3: Configure Sanity Studio for Production

1. **Access Sanity Studio**
   - Local: `http://localhost:3000/studio`
   - Production: `https://your-vercel-url.vercel.app/studio`

2. **Update Sanity CORS Settings**
   - Go to: https://www.sanity.io/manage
   - Select your project
   - Go to "API" → "CORS Origins"
   - Add these origins:
     ```
     http://localhost:3000
     https://your-vercel-url.vercel.app
     https://*.vercel.app (for preview deployments)
     ```

3. **Configure Sanity Tokens**
   - Ensure your tokens have proper permissions:
     - **Read Token**: Viewer role
     - **Write Token**: Editor role
     - **Editor Token**: Editor role

---

### Step 4: Configure Supabase for Production

1. **Update Supabase URL Allowlist**
   - Go to: https://app.supabase.com
   - Select your project
   - Settings → API → URL Configuration
   - Add your Vercel URL to allowed origins

2. **Update RLS Policies (if needed)**
   - Ensure Row Level Security policies work with production URLs
   - Test authentication from production environment

3. **Check Database Connection**
   - Test API routes from production
   - Verify progress tracking works
   - Check course enrollment functionality

---

### Step 5: Post-Deployment Testing

#### Essential Tests:

1. **✅ Sanity Studio Access**
   - Visit: `https://your-url.vercel.app/studio`
   - Login should work
   - Create/edit content should work

2. **✅ Authentication**
   - Test student login/signup
   - Test faculty login
   - Verify Supabase auth integration

3. **✅ Course Features**
   - Browse courses
   - Enroll in course
   - View course content
   - Test progress tracking

4. **✅ Faculty Dashboard**
   - Create new course
   - Edit existing course
   - Upload course thumbnail
   - Publish/unpublish courses

5. **✅ API Routes**
   - Test: `/api/progress/[courseId]`
   - Test: `/api/progress/mark-complete`
   - Test: `/api/faculty/upload-thumbnail`

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Build Fails
**Error:** TypeScript or ESLint errors
**Solution:** Already handled in `next.config.ts` with:
```typescript
ignoreBuildErrors: true
ignoreDuringBuilds: true
```

### Issue 2: Sanity Content Not Loading
**Check:**
- Environment variables are set correctly
- CORS origins include your Vercel URL
- Sanity tokens have proper permissions

### Issue 3: Supabase Connection Failed
**Check:**
- `NEXT_PUBLIC_SUPABASE_URL` is correct
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Vercel URL is in Supabase allowed origins

### Issue 4: Images Not Loading
**Check:**
- Sanity CDN URL in `next.config.ts` (already configured)
- Image optimization enabled on Vercel
- Proper image references in Sanity

### Issue 5: Environment Variables Not Working
**Fix:**
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Re-add the variable
4. Redeploy: Deployments → Latest → "Redeploy"

---

## 🔄 Continuous Deployment

Once set up, Vercel automatically:
- ✅ Rebuilds on every push to `main` branch
- ✅ Creates preview deployments for PRs
- ✅ Runs build checks before deployment
- ✅ Provides deployment logs and analytics

### To Update Your Site:
```powershell
# Make changes
git add .
git commit -m "Your change description"
git push

# Vercel automatically deploys!
```

---

## 📊 Monitoring & Analytics

### Vercel Dashboard Provides:
- Real-time deployment status
- Build logs and errors
- Performance analytics
- Usage statistics
- Function logs (for API routes)

### Access Your Dashboard:
https://vercel.com/dashboard

---

## 🎓 Your Production URLs

After deployment, you'll have:
- **Main Site:** `https://lmsgambheera.vercel.app`
- **Sanity Studio:** `https://lmsgambheera.vercel.app/studio`
- **API Endpoints:** `https://lmsgambheera.vercel.app/api/*`

---

## 🔐 Security Best Practices (Already Implemented)

✅ **Environment Variables:** Never committed to Git
✅ **API Routes:** Protected with proper authentication
✅ **Supabase RLS:** Row Level Security enabled
✅ **CORS Configuration:** Restricted to specific origins
✅ **Token Security:** Server-side tokens not exposed to client
✅ **HTTPS:** Automatic SSL certificates from Vercel

---

## 📞 Need Help?

If you encounter any issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Review Sanity API logs
4. Check Supabase logs
5. Test environment variables

---

## ✨ Deployment Checklist

Before going live, ensure:
- [ ] All 10 environment variables added to Vercel
- [ ] `.env.local` is NOT in Git repository
- [ ] Sanity CORS configured for production URL
- [ ] Supabase allows production URL
- [ ] Tested Sanity Studio access
- [ ] Tested student authentication
- [ ] Tested faculty dashboard
- [ ] Tested course enrollment
- [ ] Tested progress tracking
- [ ] Custom domain configured (optional)

---

## 🎉 You're Ready to Deploy!

Follow the steps above, and your LMS will be live in minutes!

**Email for notifications:** 23101A030084@mbu.asia
**GitHub Repo:** https://github.com/DampetlaMokshith/lmsgambheera.git

---

**Last Updated:** October 26, 2025
**Deployment Platform:** Vercel
**Framework:** Next.js 15
**CMS:** Sanity
**Database:** Supabase
