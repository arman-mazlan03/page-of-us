# 🚀 Vercel Deployment Guide - Page of Us

## Prerequisites Checklist

Before deploying, make sure you have:

- [x] Google Maps API key restricted by domain
- [ ] GitHub account
- [ ] Vercel account (free)
- [ ] All environment variables ready
- [ ] Code pushed to GitHub

---

## Step 1: Prepare Your Code (5 minutes)

### 1.1 Create `.gitignore` (Already Done)

Your `.gitignore` should already have:
```
.env*.local
.env
node_modules
.next
```

✅ This prevents secrets from being committed!

---

### 1.2 Verify `.env.local` is NOT in Git

**Run in terminal:**
```bash
git status
```

**Should NOT show `.env.local`**

If it does:
```bash
git rm --cached .env.local
git commit -m "Remove .env.local from git"
```

---

### 1.3 Create Production Build Test

**Test that your app builds:**
```bash
npm run build
```

**Should see:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

If errors appear, fix them before deploying!

---

## Step 2: Push to GitHub (5 minutes)

### 2.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - Page of Us"
```

---

### 2.2 Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `page-of-us`
3. **Keep it PRIVATE** (contains sensitive config)
4. Click "Create repository"

---

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/page-of-us.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your GitHub username!**

---

## Step 3: Deploy to Vercel (10 minutes)

### 3.1 Create Vercel Account

1. Go to: https://vercel.com/signup
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

---

### 3.2 Import Project

1. Click "Add New..." → "Project"
2. Find `page-of-us` repository
3. Click "Import"

---

### 3.3 Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (leave as is)

**Build Command:** `npm run build` (default)

**Output Directory:** `.next` (default)

**Install Command:** `npm install` (default)

---

### 3.4 Add Environment Variables

**CRITICAL:** Add all your environment variables!

Click "Environment Variables" and add these:

#### Firebase Configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD3nm-66ZqD8ap-2oXfqQkCEjF35oMBUtQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=page-of-us.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=page-of-us
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=page-of-us.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=817279102172
NEXT_PUBLIC_FIREBASE_APP_ID=1:817279102172:web:b63738bc5886af323d5819
```

#### App Configuration:
```
NEXT_PUBLIC_ALLOWED_EMAILS=armanmazlan03@gmail.com,armanmazlann03@gmail.com
NEXT_PUBLIC_WORKSPACE_ID=shared_workspace_main
NEXT_PUBLIC_SESSION_DURATION=3600000
```

#### API Keys:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYXJtYW4tbWF6bGFuMDMiLCJhIjoiY21sZmpnaTE5MDJ0ejNlcGR0ZGp4OThtaSJ9.HBMhQDY4fbyxzMKBoX2ZPQ
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBFJ79dHxhKqtElep1OLn4ZRqh9vxIo__8
```

**Important:** 
- Add each variable one by one
- Make sure names match EXACTLY
- No quotes around values
- Select "Production", "Preview", and "Development"

---

### 3.5 Deploy!

Click "Deploy"

**Wait 2-3 minutes...**

You'll see:
```
Building...
✓ Build completed
Deploying...
✓ Deployment ready
```

---

## Step 4: Configure Your Domain (5 minutes)

### 4.1 Get Your Vercel URL

After deployment, you'll get a URL like:
```
https://page-of-us.vercel.app
```

Or:
```
https://page-of-us-xyz123.vercel.app
```

**Copy this URL!**

---

### 4.2 Update Google Maps API Restrictions

1. Go to: [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Click your API key
4. Under "Application restrictions" → "HTTP referrers"
5. **Add your Vercel URL:**
   ```
   https://page-of-us.vercel.app/*
   https://page-of-us-*.vercel.app/*
   ```
6. Keep localhost for development:
   ```
   http://localhost:3001/*
   ```
7. Click "Save"

---

### 4.3 Update Mapbox Token Restrictions

1. Go to: [Mapbox Account](https://account.mapbox.com/)
2. Access Tokens
3. Click your token
4. **Add URL restriction:**
   ```
   https://page-of-us.vercel.app/*
   https://page-of-us-*.vercel.app/*
   ```
5. Keep localhost:
   ```
   http://localhost:3001/*
   ```
6. Click "Update token"

---

### 4.4 Update Firebase Authorized Domains

1. Go to: [Firebase Console](https://console.firebase.google.com/)
2. Authentication → Settings → Authorized domains
3. Click "Add domain"
4. Add your Vercel domain:
   ```
   page-of-us.vercel.app
   ```
5. Click "Add"

---

## Step 5: Test Your Deployment (5 minutes)

### 5.1 Visit Your Site

Go to: `https://page-of-us.vercel.app`

---

### 5.2 Test Login

1. Try logging in with your email
2. Should work!
3. Check if map loads
4. Check if you can see your data

---

### 5.3 Test Features

- [ ] Login works
- [ ] Map loads correctly
- [ ] Can see locations
- [ ] Can view albums
- [ ] Can upload photos
- [ ] Can play music
- [ ] Session lasts 1 hour
- [ ] Auto-logout works

---

## Step 6: Custom Domain (Optional)

### 6.1 Buy a Domain

From: Namecheap, GoDaddy, Google Domains, etc.

Example: `pageofus.com`

---

### 6.2 Add to Vercel

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `pageofus.com`
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-60 minutes)

---

### 6.3 Update API Restrictions

**Google Maps:**
```
https://pageofus.com/*
```

**Mapbox:**
```
https://pageofus.com/*
```

**Firebase:**
```
pageofus.com
```

---

## 🔧 Troubleshooting

### Issue: Build Fails

**Check:**
1. Run `npm run build` locally first
2. Fix any TypeScript errors
3. Fix any lint errors
4. Push fixes to GitHub
5. Vercel will auto-redeploy

---

### Issue: Environment Variables Not Working

**Fix:**
1. Vercel Dashboard → Settings → Environment Variables
2. Check all variables are added
3. Check for typos
4. Redeploy: Deployments → ⋯ → Redeploy

---

### Issue: Map Not Loading

**Fix:**
1. Check Google Maps API key restrictions
2. Make sure Vercel domain is added
3. Check browser console for errors
4. Verify API key is in environment variables

---

### Issue: Login Not Working

**Fix:**
1. Check Firebase authorized domains
2. Add Vercel domain to Firebase
3. Check environment variables
4. Check browser console

---

### Issue: "This site can't be reached"

**Fix:**
1. Wait a few minutes (DNS propagation)
2. Clear browser cache
3. Try incognito mode
4. Check Vercel deployment status

---

## 📊 Deployment Checklist

**Before Deployment:**
- [ ] `.env.local` is in `.gitignore`
- [ ] Code builds successfully (`npm run build`)
- [ ] All features work locally
- [ ] Code pushed to GitHub (private repo)

**During Deployment:**
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] All environment variables added
- [ ] Deployment successful

**After Deployment:**
- [ ] Google Maps API restrictions updated
- [ ] Mapbox token restrictions updated
- [ ] Firebase authorized domains updated
- [ ] Site tested and working
- [ ] Login tested
- [ ] All features tested

---

## 🎯 Quick Commands Reference

**Test build locally:**
```bash
npm run build
npm start
```

**Push to GitHub:**
```bash
git add .
git commit -m "Update message"
git push
```

**Vercel auto-deploys on push!**

---

## 🔄 Making Updates

### After Deployment:

**1. Make changes locally**
```bash
# Edit your code
npm run dev  # Test locally
```

**2. Push to GitHub**
```bash
git add .
git commit -m "Description of changes"
git push
```

**3. Vercel auto-deploys!**
- Vercel detects the push
- Automatically builds
- Automatically deploys
- Usually takes 2-3 minutes

**4. Check deployment**
- Go to Vercel Dashboard
- See deployment status
- Visit your site

---

## 🎉 You're Live!

**Your app is now:**
- ✅ Deployed to Vercel
- ✅ Accessible worldwide
- ✅ Auto-deploys on push
- ✅ HTTPS enabled
- ✅ Fast CDN delivery
- ✅ Production-ready!

**Share your URL:**
```
https://page-of-us.vercel.app
```

**Or your custom domain:**
```
https://pageofus.com
```

---

## 📝 Important Notes

**Free Tier Limits:**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ More than enough for personal use!

**Security:**
- ✅ Environment variables are secure
- ✅ Not exposed in client
- ✅ Only you can see them in Vercel dashboard

**Performance:**
- ✅ Global CDN
- ✅ Automatic caching
- ✅ Fast page loads
- ✅ Optimized images

---

## 🚀 Next Steps

**After successful deployment:**

1. **Test thoroughly** - Try all features
2. **Share with allowed users** - Send them the URL
3. **Monitor usage** - Check Vercel analytics
4. **Set up monitoring** - Firebase analytics
5. **Enjoy!** - Your app is live! 🎊

---

**Need help? Check:**
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Firebase Docs: https://firebase.google.com/docs

**Happy deploying!** 🚀✨
