# ✅ Vercel Deployment Checklist

## Quick 30-Minute Deployment Guide

Follow these steps in order:

---

## ☐ Step 1: Test Build (2 minutes)

```bash
npm run build
```

**Expected:** ✓ Compiled successfully

**If errors:** Fix them before continuing!

---

## ☐ Step 2: Push to GitHub (5 minutes)

### Create GitHub Repo:
1. Go to: https://github.com/new
2. Name: `page-of-us`
3. **PRIVATE** repository
4. Create

### Push Code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/page-of-us.git
git branch -M main
git push -u origin main
```

---

## ☐ Step 3: Deploy to Vercel (10 minutes)

### Sign Up:
1. Go to: https://vercel.com/signup
2. Sign up with GitHub
3. Authorize Vercel

### Import Project:
1. Click "Add New..." → "Project"
2. Select `page-of-us`
3. Click "Import"

### Add Environment Variables:

**Copy these from your `.env.local`:**

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD3nm-66ZqD8ap-2oXfqQkCEjF35oMBUtQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=page-of-us.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=page-of-us
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=page-of-us.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=817279102172
NEXT_PUBLIC_FIREBASE_APP_ID=1:817279102172:web:b63738bc5886af323d5819
NEXT_PUBLIC_ALLOWED_EMAILS=armanmazlan03@gmail.com,armanmazlann03@gmail.com
NEXT_PUBLIC_WORKSPACE_ID=shared_workspace_main
NEXT_PUBLIC_SESSION_DURATION=3600000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYXJtYW4tbWF6bGFuMDMiLCJhIjoiY21sZmpnaTE5MDJ0ejNlcGR0ZGp4OThtaSJ9.HBMhQDY4fbyxzMKBoX2ZPQ
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBFJ79dHxhKqtElep1OLn4ZRqh9vxIo__8
```

**Important:**
- Add each variable one by one
- Select: Production, Preview, Development
- No quotes around values

### Deploy:
Click "Deploy" and wait 2-3 minutes

---

## ☐ Step 4: Update API Restrictions (10 minutes)

### Your Vercel URL:
After deployment, copy your URL (e.g., `https://page-of-us.vercel.app`)

### Google Maps API:
1. [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Click your API key
4. HTTP referrers → Add:
   ```
   https://page-of-us.vercel.app/*
   https://page-of-us-*.vercel.app/*
   http://localhost:3001/*
   ```
5. Save

### Mapbox Token:
1. [Mapbox Account](https://account.mapbox.com/)
2. Access Tokens → Your token
3. URL restrictions → Add:
   ```
   https://page-of-us.vercel.app/*
   https://page-of-us-*.vercel.app/*
   http://localhost:3001/*
   ```
4. Update

### Firebase:
1. [Firebase Console](https://console.firebase.google.com/)
2. Authentication → Settings → Authorized domains
3. Add domain:
   ```
   page-of-us.vercel.app
   ```
4. Add

---

## ☐ Step 5: Test Deployment (3 minutes)

Visit: `https://page-of-us.vercel.app`

**Test:**
- [ ] Site loads
- [ ] Login works
- [ ] Map displays
- [ ] Can see locations
- [ ] Can view albums
- [ ] Can upload photos
- [ ] Session works (1 hour)

---

## 🎉 Done!

**Your app is live at:**
```
https://page-of-us.vercel.app
```

**Future updates:**
```bash
git add .
git commit -m "Update message"
git push
```
Vercel auto-deploys! ✨

---

## 🚨 Troubleshooting

**Build fails?**
- Run `npm run build` locally
- Fix errors
- Push again

**Map not loading?**
- Check Google Maps API restrictions
- Verify Vercel domain is added

**Login not working?**
- Check Firebase authorized domains
- Verify environment variables

**Need detailed help?**
- See `VERCEL_DEPLOYMENT.md`

---

## 📊 Total Time: ~30 minutes

- Step 1: 2 min (test build)
- Step 2: 5 min (GitHub)
- Step 3: 10 min (Vercel)
- Step 4: 10 min (API restrictions)
- Step 5: 3 min (testing)

**You're live!** 🚀
