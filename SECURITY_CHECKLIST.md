# 🔒 Security Implementation Checklist

## ✅ CRITICAL - Do These First (15 minutes)

### 1. Apply Firestore Security Rules

**Steps:**
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: "page-of-us"
3. Click "Firestore Database" in left menu
4. Click "Rules" tab
5. Copy content from `firestore.rules` file
6. Paste into the editor
7. Click "Publish"
8. ✅ Done!

**What this does:**
- ✅ Prevents unauthorized database access
- ✅ Enforces workspace isolation
- ✅ Requires authentication for all operations
- ✅ Protects your data from anyone with your Firebase config

---

### 2. Apply Storage Security Rules

**Steps:**
1. In Firebase Console
2. Click "Storage" in left menu
3. Click "Rules" tab
4. Copy content from `storage.rules` file
5. Paste into the editor
6. Click "Publish"
7. ✅ Done!

**What this does:**
- ✅ Limits file sizes (100MB images/videos, 50MB audio)
- ✅ Validates file types
- ✅ Requires authentication for uploads
- ✅ Prevents storage abuse

---

### 3. Restrict Google Maps API Key

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click your API key (the one in `.env.local`)
5. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Click "Add an item"
   - Add: `http://localhost:3001/*`
   - Add: `http://localhost:3000/*`
   - (Add your production domain when ready)
6. Under "API restrictions":
   - Select "Restrict key"
   - Check: "Maps JavaScript API"
   - Check: "Places API"
   - Check: "Geocoding API"
7. Click "Save"
8. ✅ Done!

**What this does:**
- ✅ Prevents key usage from other domains
- ✅ Limits which APIs can be called
- ✅ Protects your quota
- ✅ Prevents unauthorized usage

---

### 4. Restrict Mapbox Token

**Steps:**
1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Click "Access tokens"
3. Find your token (the one in `.env.local`)
4. Click the token name
5. Under "Token restrictions":
   - Click "Add a URL restriction"
   - Add: `http://localhost:3001/*`
   - Add: `http://localhost:3000/*`
   - (Add your production domain when ready)
6. Click "Update token"
7. ✅ Done!

**What this does:**
- ✅ Prevents token usage from other domains
- ✅ Protects your usage quota
- ✅ Prevents unauthorized map loads

---

## 📊 IMPORTANT - Do These Soon (30 minutes)

### 5. Set Up Usage Quotas

**Google Maps:**
1. Google Cloud Console → "APIs & Services" → "Quotas"
2. Set daily limits:
   - Maps JavaScript API: 25,000 requests/day
   - Places API: 1,000 requests/day
3. Set up billing alerts

**Firebase:**
1. Firebase Console → "Usage and billing"
2. Set up budget alerts:
   - Alert at 50% of budget
   - Alert at 80% of budget
   - Alert at 100% of budget

---

### 6. Enable 2FA on Accounts

**Firebase/Google Account:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click "2-Step Verification"
3. Follow setup instructions
4. ✅ Done!

**Mapbox Account:**
1. Mapbox Account Settings
2. Security
3. Enable Two-Factor Authentication

---

### 7. Verify .gitignore

**Check that `.env.local` is NOT committed:**
```bash
# Run in terminal:
git status

# Should NOT show .env.local
# If it does, run:
git rm --cached .env.local
git commit -m "Remove .env.local from git"
```

**Verify `.gitignore` contains:**
```
.env*.local
.env
```

---

## 🎯 RECOMMENDED - Do Before Production

### 8. Add Security Headers

**Already created in guide!**
- See `SECURITY_GUIDE.md` for `next.config.ts` updates
- Adds HTTPS enforcement
- Adds XSS protection
- Adds clickjacking protection

---

### 9. Create Production Environment

**Steps:**
1. Create new Firebase project for production
2. Create new API keys for production
3. Use separate `.env.production` file
4. Never mix dev/prod credentials

---

### 10. Set Up Monitoring

**Firebase:**
1. Enable Firebase Analytics
2. Set up crash reporting
3. Monitor authentication events

**Google Cloud:**
1. Enable Cloud Monitoring
2. Set up alerts for:
   - High API usage
   - Error rates
   - Unusual traffic

---

## 📋 Quick Verification

### After Applying Firestore Rules:

**Test 1: Try to read without auth**
```javascript
// Open browser console on login page (before logging in)
// Try to access Firestore:
firebase.firestore().collection('locations').get()
// Should fail with "permission-denied" ✅
```

**Test 2: Try to read after auth**
```javascript
// After logging in, try again:
firebase.firestore().collection('locations').get()
// Should succeed ✅
```

---

### After Restricting API Keys:

**Test 1: Try from different domain**
- Open your site from a different domain
- Map should not load ✅

**Test 2: Try from allowed domain**
- Open from localhost:3001
- Map should load ✅

---

## 🚨 Security Checklist Summary

**CRITICAL (Do Now):**
- [ ] Apply Firestore security rules
- [ ] Apply Storage security rules
- [ ] Restrict Google Maps API key
- [ ] Restrict Mapbox token

**IMPORTANT (Do Soon):**
- [ ] Set up usage quotas
- [ ] Enable 2FA on accounts
- [ ] Verify .gitignore
- [ ] Set up billing alerts

**RECOMMENDED (Before Production):**
- [ ] Add security headers
- [ ] Create production environment
- [ ] Set up monitoring
- [ ] Regular security audits

---

## 🎉 Current Security Status

**Before:**
- ⭐⭐ Basic Security
- ❌ Database open to anyone with config
- ❌ API keys unrestricted
- ❌ No usage limits

**After Critical Steps:**
- ⭐⭐⭐⭐ Very Good Security
- ✅ Database access controlled
- ✅ API keys restricted
- ✅ Workspace isolation
- ✅ File type/size validation

**After All Steps:**
- ⭐⭐⭐⭐⭐ Excellent Security
- ✅ All above
- ✅ Usage monitoring
- ✅ 2FA enabled
- ✅ Production-ready

---

## 📞 Need Help?

**If Firestore rules fail:**
- Check that all documents have `workspaceId` field
- Run the workspace migration if needed
- Check Firebase Console → Firestore → Rules → "Rules playground"

**If API keys don't work after restriction:**
- Make sure you added the correct domain
- Include the `/*` wildcard
- Wait a few minutes for changes to propagate

**If storage uploads fail:**
- Check file size (max 100MB for media, 50MB for music)
- Check file type (images, videos, audio only)
- Make sure user is authenticated

---

## ✅ You're Done!

**After completing the CRITICAL steps, your app will be:**
- 🔒 Secure from unauthorized access
- 🛡️ Protected from API abuse
- 💰 Protected from unexpected costs
- 🚀 Ready for production deployment

**Total time: ~15 minutes for critical steps!**

Start with the Firestore rules - that's the most important! 🎯
