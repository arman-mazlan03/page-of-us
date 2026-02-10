# 🚨 URGENT FIX: Session Logout + Firestore Rules

## You Have 2 Problems:

### Problem 1: Session Logs Out in 3 Minutes
**Cause:** AuthContext tries to read user document from Firestore, but secure rules block it, causing logout.

### Problem 2: Firestore Permission Denied
**Cause:** Your data doesn't have `workspaceId` field yet.

---

## ✅ SOLUTION (Follow in Order)

### Step 1: Apply Temporary Rules (2 minutes)

**Go to Firebase Console:**
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Firestore Database → Rules
3. **Paste this:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY - Allow all authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click "Publish"
5. ✅ Done!

**This will:**
- ✅ Stop the 3-minute logout issue
- ✅ Allow migration to run
- ✅ Let you use the app normally

---

### Step 2: Run Migration (1 minute)

1. **Refresh your browser** (Ctrl + Shift + R)
2. **Log in** (should work now)
3. Go to: `http://localhost:3001/migrate-workspace`
4. Click "🚀 Start Migration"
5. Wait for "🎉 Migration complete!"
6. ✅ Done!

---

### Step 3: Apply Secure Rules (2 minutes)

**Go back to Firebase Console:**
1. Firestore Database → Rules
2. **Paste this:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isInWorkspace(workspaceId) {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.workspaceId == workspaceId;
    }
    
    function getUserWorkspace() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.workspaceId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn() && isOwner(userId);
      allow create, update: if isSignedIn() && isOwner(userId);
      allow delete: if false;
    }
    
    // Workspaces collection
    match /workspaces/{workspaceId} {
      allow read: if isInWorkspace(workspaceId);
      allow write: if false;
    }
    
    // Locations collection
    match /locations/{locationId} {
      allow read: if isSignedIn() && isInWorkspace(resource.data.workspaceId);
      allow create: if isSignedIn() && request.resource.data.workspaceId == getUserWorkspace();
      allow update, delete: if isSignedIn() && isInWorkspace(resource.data.workspaceId);
    }
    
    // Albums collection
    match /albums/{albumId} {
      allow read: if isSignedIn() && isInWorkspace(resource.data.workspaceId);
      allow create: if isSignedIn() && request.resource.data.workspaceId == getUserWorkspace();
      allow update, delete: if isSignedIn() && isInWorkspace(resource.data.workspaceId);
    }
    
    // Media collection
    match /media/{mediaId} {
      allow read: if isSignedIn() && isInWorkspace(resource.data.workspaceId);
      allow create: if isSignedIn() && request.resource.data.workspaceId == getUserWorkspace();
      allow update, delete: if isSignedIn() && isInWorkspace(resource.data.workspaceId);
    }
    
    // Music collection
    match /music/{musicId} {
      allow read: if isSignedIn() && isInWorkspace(resource.data.workspaceId);
      allow create: if isSignedIn() && request.resource.data.workspaceId == getUserWorkspace();
      allow update, delete: if isSignedIn() && isInWorkspace(resource.data.workspaceId);
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click "Publish"
4. ✅ Done!

---

### Step 4: Refresh Browser

1. Hard refresh: Ctrl + Shift + R
2. Log in
3. ✅ Should work perfectly now!

---

## 🎯 Why This Fixes Both Issues:

### Session Logout Fix:
- AuthContext reads user document from Firestore
- Temporary rules allow this read
- Session check succeeds
- No more 3-minute logout!

### Permission Denied Fix:
- Migration adds `workspaceId` to all data
- Secure rules can now check `workspaceId`
- All queries work properly

---

## ⏱️ Timeline:

```
NOW: 
- ❌ Can't read Firestore (permission denied)
- ❌ Session check fails
- ❌ Logs out in 3 minutes

↓ Step 1: Temporary Rules

- ✅ Can read Firestore
- ✅ Session check works
- ✅ No logout issue

↓ Step 2: Migration

- ✅ All data has workspaceId
- ✅ Ready for secure rules

↓ Step 3: Secure Rules

- ✅ Workspace isolation
- ✅ Secure database
- ✅ No logout issue
- ✅ Everything works!
```

---

## 🧪 Verification:

**After Step 1:**
- Log in
- Wait 5 minutes
- ✅ Should NOT log out

**After Step 2:**
- Check browser console
- ✅ No permission errors

**After Step 3:**
- Use app normally
- ✅ Everything works
- ✅ Secure database

---

## 🚨 IMPORTANT:

**Don't skip steps!**
- Step 1 fixes the logout issue
- Step 2 prepares data for security
- Step 3 secures the database

**Do them in order!**

---

## 📋 Quick Checklist:

- [ ] Step 1: Apply temporary rules (Firebase Console)
- [ ] Refresh browser and log in
- [ ] Step 2: Run migration (/migrate-workspace)
- [ ] Step 3: Apply secure rules (Firebase Console)
- [ ] Refresh browser and test

**Total time: ~5 minutes**

---

## ✅ Start Now:

**1. Open Firebase Console**
**2. Go to Firestore → Rules**
**3. Paste the temporary rules from Step 1**
**4. Click Publish**

**This will immediately fix your 3-minute logout issue!** 🚀

Then do steps 2 and 3 to complete the security setup! 🔒✨
