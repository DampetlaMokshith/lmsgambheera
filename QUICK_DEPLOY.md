# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] `.env.local` is in `.gitignore`
- [x] `.env.example` created as template
- [x] `vercel.json` configured for deployment
- [x] `README.md` created with documentation
- [x] `DEPLOYMENT_GUIDE.md` created with step-by-step instructions
- [x] Sanity CORS configured for Vercel domains
- [x] All files committed to Git
- [x] GitHub remote added

## 📦 Ready to Push to GitHub

Run these commands:
```powershell
cd "c:\Users\moksh\OneDrive\Desktop\lmsgambheera"
git push -u origin main
```

**Note:** You may need to authenticate with GitHub. If asked for credentials:
- Username: DampetlaMokshith
- Password: Use a Personal Access Token (not your password)
  - Create at: https://github.com/settings/tokens

## 🌐 Deploy to Vercel

After pushing to GitHub:

### Option 1: Vercel Website (RECOMMENDED)
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import `DampetlaMokshith/lmsgambheera`
5. Add environment variables (see below)
6. Click "Deploy"

### Option 2: Vercel CLI
```powershell
npm install -g vercel
vercel login
vercel
```

## 🔑 Environment Variables to Add in Vercel

Copy these from your `.env.local` file:

```
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
NEXT_PUBLIC_SANITY_API_VERSION
NEXT_PUBLIC_SANITY_READ_TOKEN
SANITY_API_TOKEN
SANITY_API_WRITE_TOKEN
NEXT_PUBLIC_SANITY_EDITOR_TOKEN
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**IMPORTANT:** 
- Copy the actual VALUES from your `.env.local` file
- Add them one by one in Vercel's Environment Variables section
- Available for: Production, Preview, and Development

## 🎯 Post-Deployment Tasks

After deployment completes:

1. **Update Sanity CORS**
   - Go to https://www.sanity.io/manage
   - Select your project → API → CORS Origins
   - Add: `https://your-app.vercel.app`

2. **Update Supabase Settings**
   - Go to https://app.supabase.com
   - Select your project → Settings → API
   - Add Vercel URL to allowed origins

3. **Test Your Deployment**
   - [ ] Main site loads: `https://your-app.vercel.app`
   - [ ] Sanity Studio works: `https://your-app.vercel.app/studio`
   - [ ] Student login works
   - [ ] Faculty login works
   - [ ] Courses load correctly
   - [ ] Progress tracking works
   - [ ] Image uploads work

## 📊 Monitor Deployment

Access your Vercel dashboard:
- https://vercel.com/dashboard
- View deployment logs
- Check build status
- Monitor performance

## 🆘 If Something Goes Wrong

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Check Sanity CORS settings
4. Verify Supabase connection
5. Review `DEPLOYMENT_GUIDE.md` for detailed troubleshooting

## 📞 Contact

- Email: 23101A030084@mbu.asia
- GitHub: @DampetlaMokshith

---

**Ready to deploy? Push to GitHub first, then deploy to Vercel!**

```powershell
git push -u origin main
```
