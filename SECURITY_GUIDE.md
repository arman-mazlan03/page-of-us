# 🔒 Security Best Practices Guide

## Current Security Status

### ✅ What You Already Have:
1. **Email Whitelist** - Only allowed emails can access
2. **Firebase Authentication** - Secure password handling
3. **1-Hour Sessions** - Auto-logout for security
4. **Environment Variables** - API keys in `.env.local`
5. **`.gitignore`** - Prevents committing secrets

---

## 🚨 Current Security Concerns

### 1. API Keys Exposed in Frontend

**Problem:**
```javascript
// These are visible in browser:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD3nm-66ZqD8ap-2oXfqQkCEjF35oMBUtQ
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBFJ79dHxhKqtElep1OLn4ZRqh9vxIo__8
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYXJtYW4tbWF6bGFuMDMi...
```

**Why It's a Concern:**
- ❌ Anyone can view source code
- ❌ Can extract API keys
- ❌ Could use your quota
- ❌ Could cost you money

**Solution:**
- ✅ Use Firebase Security Rules (most important!)
- ✅ Restrict API keys by domain
- ✅ Set usage quotas
- ✅ Monitor usage

---

### 2. No Firestore Security Rules

**Problem:**
```javascript
// Currently, anyone with Firebase config can:
- Read all data
- Write to your database
- Delete data
- Bypass authentication
```

**Solution:**
Implement Firestore Security Rules (see below)

---

### 3. No Rate Limiting

**Problem:**
- Unlimited login attempts
- No protection against brute force
- No API rate limiting

**Solution:**
Implement rate limiting (see below)

---

## 🛡️ Security Enhancements

### 1. Firestore Security Rules (CRITICAL!)

**Current State:**
```javascript
// Probably set to test mode (INSECURE):
allow read, write: if true;
```

**Secure Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function - check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function - check if user owns the resource
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Helper function - check if user is in workspace
    function isInWorkspace(workspaceId) {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.workspaceId == workspaceId;
    }
    
    // Users collection
    match /users/{userId} {
      // Can read own user document
      allow read: if isSignedIn() && isOwner(userId);
      // Can create/update own user document
      allow create, update: if isSignedIn() && isOwner(userId);
      // Cannot delete
      allow delete: if false;
    }
    
    // Workspaces collection
    match /workspaces/{workspaceId} {
      // Can read if in workspace
      allow read: if isInWorkspace(workspaceId);
      // Cannot write (managed by app)
      allow write: if false;
    }
    
    // Locations collection
    match /locations/{locationId} {
      // Can read if in same workspace
      allow read: if isSignedIn() && 
                     isInWorkspace(resource.data.workspaceId);
      // Can create if authenticated and includes workspaceId
      allow create: if isSignedIn() && 
                       request.resource.data.workspaceId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.workspaceId;
      // Can update/delete if in same workspace
      allow update, delete: if isSignedIn() && 
                               isInWorkspace(resource.data.workspaceId);
    }
    
    // Albums collection
    match /albums/{albumId} {
      // Can read if in same workspace
      allow read: if isSignedIn() && 
                     isInWorkspace(resource.data.workspaceId);
      // Can create if authenticated
      allow create: if isSignedIn() && 
                       request.resource.data.workspaceId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.workspaceId;
      // Can update/delete if in same workspace
      allow update, delete: if isSignedIn() && 
                               isInWorkspace(resource.data.workspaceId);
    }
    
    // Media collection
    match /media/{mediaId} {
      // Can read if in same workspace
      allow read: if isSignedIn() && 
                     isInWorkspace(resource.data.workspaceId);
      // Can create if authenticated
      allow create: if isSignedIn() && 
                       request.resource.data.workspaceId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.workspaceId;
      // Can update/delete if in same workspace
      allow update, delete: if isSignedIn() && 
                               isInWorkspace(resource.data.workspaceId);
    }
    
    // Music collection
    match /music/{musicId} {
      // Can read if in same workspace
      allow read: if isSignedIn() && 
                     isInWorkspace(resource.data.workspaceId);
      // Can create if authenticated
      allow create: if isSignedIn() && 
                       request.resource.data.workspaceId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.workspaceId;
      // Can update/delete if in same workspace
      allow update, delete: if isSignedIn() && 
                               isInWorkspace(resource.data.workspaceId);
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**How to Apply:**
1. Go to Firebase Console
2. Firestore Database → Rules
3. Replace with above rules
4. Click "Publish"

---

### 2. Firebase Storage Security Rules

**Secure Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Media files (photos/videos)
    match /media/{allPaths=**} {
      // Anyone authenticated can read
      allow read: if isSignedIn();
      // Only authenticated users can upload
      allow write: if isSignedIn() &&
                      request.resource.size < 100 * 1024 * 1024 && // 100MB limit
                      request.resource.contentType.matches('image/.*|video/.*');
    }
    
    // Music files
    match /music/{allPaths=**} {
      // Anyone authenticated can read
      allow read: if isSignedIn();
      // Only authenticated users can upload
      allow write: if isSignedIn() &&
                      request.resource.size < 50 * 1024 * 1024 && // 50MB limit
                      request.resource.contentType.matches('audio/.*');
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

### 3. Restrict API Keys by Domain

#### **Google Maps API Key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Click your API key
4. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add: `localhost:3001/*` (for development)
   - Add: `yourdomain.com/*` (for production)
5. Under "API restrictions":
   - Select "Restrict key"
   - Enable only: Maps JavaScript API, Places API
6. Save

#### **Firebase API Key:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → General
3. Scroll to "Your apps"
4. Under "Authorized domains":
   - Add your production domain
   - `localhost` is already there for development

#### **Mapbox Token:**

1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Access Tokens
3. Click your token
4. Under "Token restrictions":
   - Add URL: `http://localhost:3001/*`
   - Add URL: `https://yourdomain.com/*`
5. Save

---

### 4. Environment Variable Security

**Current `.env.local`:**
```bash
# ✅ GOOD - Not committed to Git
# ❌ BAD - Keys visible in browser (NEXT_PUBLIC_*)
```

**Best Practices:**

**For Public Keys (Frontend):**
```bash
# These WILL be visible in browser - that's OK if restricted
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
NEXT_PUBLIC_MAPBOX_TOKEN=xxx
```

**For Secret Keys (Backend Only):**
```bash
# These should NEVER have NEXT_PUBLIC_ prefix
# Only accessible in server-side code
FIREBASE_ADMIN_KEY=xxx
DATABASE_PASSWORD=xxx
SECRET_KEY=xxx
```

**Important:**
- ✅ `.env.local` is in `.gitignore`
- ✅ Never commit `.env.local` to Git
- ✅ Use different keys for dev/production
- ✅ Rotate keys periodically

---

### 5. Password Security

**Current Implementation:**
```javascript
// ✅ GOOD - Firebase handles this securely:
- Passwords hashed with bcrypt
- Salted automatically
- Never stored in plain text
- Transmitted over HTTPS
```

**Additional Recommendations:**

**Enforce Strong Passwords:**
```javascript
// Add to signup validation
function isStrongPassword(password) {
  return password.length >= 12 &&
         /[A-Z]/.test(password) &&  // Uppercase
         /[a-z]/.test(password) &&  // Lowercase
         /[0-9]/.test(password) &&  // Number
         /[^A-Za-z0-9]/.test(password); // Special char
}
```

**Password Reset Security:**
- ✅ Firebase handles this
- ✅ Email verification required
- ✅ Time-limited reset links
- ✅ One-time use tokens

---

### 6. Rate Limiting

**Implement Login Rate Limiting:**

Create `lib/rateLimiter.ts`:
```typescript
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(email);
  
  if (!attempt || now > attempt.resetTime) {
    // First attempt or reset time passed
    loginAttempts.set(email, { count: 1, resetTime: now + 15 * 60 * 1000 }); // 15 min
    return true;
  }
  
  if (attempt.count >= 5) {
    // Too many attempts
    return false;
  }
  
  // Increment attempt
  attempt.count++;
  return true;
}

export function resetRateLimit(email: string): void {
  loginAttempts.delete(email);
}
```

**Use in AuthContext:**
```typescript
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimiter';

const signIn = async (email: string, password: string) => {
  // Check rate limit
  if (!checkRateLimit(email)) {
    throw new Error('Too many login attempts. Please try again in 15 minutes.');
  }
  
  try {
    // ... existing login code ...
    
    // Reset on successful login
    resetRateLimit(email);
  } catch (error) {
    // Don't reset on failure
    throw error;
  }
};
```

---

### 7. HTTPS Only (Production)

**Enforce HTTPS in Production:**

Add to `next.config.ts`:
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

---

### 8. Content Security Policy (CSP)

**Add CSP Headers:**
```typescript
{
  key: 'Content-Security-Policy',
  value: `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com;
    frame-src 'self' https://*.google.com;
  `.replace(/\s{2,}/g, ' ').trim()
}
```

---

## 🎯 Security Checklist

### Immediate Actions (Do Now):

- [ ] **Apply Firestore Security Rules** (CRITICAL!)
- [ ] **Apply Storage Security Rules** (CRITICAL!)
- [ ] **Restrict Google Maps API key by domain**
- [ ] **Restrict Mapbox token by URL**
- [ ] **Verify `.env.local` is in `.gitignore`**
- [ ] **Never commit `.env.local` to Git**

### Short-term (This Week):

- [ ] **Implement rate limiting for login**
- [ ] **Add password strength validation**
- [ ] **Set up usage quotas on APIs**
- [ ] **Monitor Firebase usage**
- [ ] **Enable 2FA on Firebase account**

### Long-term (Before Production):

- [ ] **Set up HTTPS (required for production)**
- [ ] **Add security headers**
- [ ] **Implement CSP**
- [ ] **Regular security audits**
- [ ] **Set up monitoring/alerts**
- [ ] **Create separate dev/prod environments**

---

## 📊 Security Levels

### Current Security: ⭐⭐⭐ (Good)
- ✅ Email whitelist
- ✅ Firebase authentication
- ✅ 1-hour sessions
- ✅ Environment variables
- ❌ No Firestore rules
- ❌ No API restrictions

### With Firestore Rules: ⭐⭐⭐⭐ (Very Good)
- ✅ All above
- ✅ Database access control
- ✅ Workspace isolation
- ❌ No rate limiting

### With All Enhancements: ⭐⭐⭐⭐⭐ (Excellent)
- ✅ All above
- ✅ Rate limiting
- ✅ API restrictions
- ✅ Security headers
- ✅ Production-ready

---

## 🚀 Quick Start

### Step 1: Apply Firestore Rules (5 minutes)

1. Copy the Firestore rules above
2. Go to Firebase Console
3. Firestore → Rules
4. Paste and publish

### Step 2: Restrict API Keys (10 minutes)

1. Google Maps: Add domain restrictions
2. Mapbox: Add URL restrictions
3. Firebase: Verify authorized domains

### Step 3: Monitor Usage (Ongoing)

1. Check Firebase usage daily
2. Set up billing alerts
3. Monitor for unusual activity

---

## 💡 Additional Tips

### For Development:
- Use separate Firebase project for dev
- Use different API keys for dev/prod
- Never use production keys in development

### For Production:
- Use environment-specific configs
- Enable Firebase App Check
- Set up monitoring and alerts
- Regular security audits
- Keep dependencies updated

### For Team:
- Never share `.env.local` via chat/email
- Use secure password managers
- Enable 2FA on all accounts
- Regular security training

---

## 🎉 Summary

**Most Critical (Do First):**
1. ✅ Apply Firestore Security Rules
2. ✅ Apply Storage Security Rules
3. ✅ Restrict API keys by domain

**Important (Do Soon):**
4. ✅ Implement rate limiting
5. ✅ Add security headers
6. ✅ Monitor usage

**Best Practices (Ongoing):**
7. ✅ Regular security audits
8. ✅ Keep dependencies updated
9. ✅ Monitor for unusual activity

---

**Your app will be much more secure after implementing these!** 🔒✨
