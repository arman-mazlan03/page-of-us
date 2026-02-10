# Step 2 Setup Guide: Firebase Configuration

## ✅ What We've Built

In Step 2, we've created:
- ✅ Firebase configuration (`lib/firebase.ts`)
- ✅ Authentication context with session management (`contexts/AuthContext.tsx`)
- ✅ Beautiful login page with animations (`app/login/page.tsx`)
- ✅ Protected route wrapper (`components/ProtectedRoute.tsx`)
- ✅ Map page placeholder (`app/map/page.tsx`)
- ✅ Auto-redirect logic on home page

## 🔥 Firebase Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "page-of-us" (or your preferred name)
4. Disable Google Analytics (optional for this private project)
5. Click "Create project"

### Step 2: Enable Authentication

1. In your Firebase project, click "Authentication" in the left sidebar
2. Click "Get started"
3. Click on "Email/Password" provider
4. Enable "Email/Password" (toggle it on)
5. Click "Save"

### Step 3: Create Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location close to you
5. Click "Enable"

### Step 4: Set Up Firestore Security Rules

In the "Rules" tab, replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated and verified users can read/write
    match /{document=**} {
      allow read, write: if request.auth != null 
                         && request.auth.token.email_verified == true;
    }
  }
}
```

Click "Publish"

### Step 5: Enable Storage

1. Click "Storage" in the left sidebar
2. Click "Get started"
3. Use production mode
4. Choose same location as Firestore
5. Click "Done"

### Step 6: Set Up Storage Security Rules

In the "Rules" tab, replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null 
                         && request.auth.token.email_verified == true;
    }
  }
}
```

Click "Publish"

### Step 7: Get Firebase Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Register your app with nickname "page-of-us-web"
6. Copy the `firebaseConfig` object

### Step 8: Update .env.local

Open `.env.local` and replace the placeholder values with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Your email address
NEXT_PUBLIC_ALLOWED_EMAIL=youremail@example.com

# Keep these as is
NEXT_PUBLIC_SESSION_DURATION=18000000
NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_MAPBOX_TOKEN_HERE
```

### Step 9: Create Your User Account

1. In Firebase Console, go to "Authentication"
2. Click "Users" tab
3. Click "Add user"
4. Enter your email and password
5. Click "Add user"

### Step 10: Verify Your Email

Since Firebase doesn't auto-send verification emails for manually created users:

**Option A: Use the login page**
1. Try to log in with your credentials
2. The system will send a verification email
3. Check your inbox and click the verification link
4. Log in again

**Option B: Manual verification (for testing)**
1. In Firebase Console > Authentication > Users
2. Click on your user
3. You can manually verify the email for testing

## 🧪 Testing Step 2

After setting up Firebase:

1. Make sure your dev server is running: `npm run dev`
2. Open http://localhost:3000
3. You should be redirected to `/login`
4. Try logging in with your email and password
5. If email is not verified, you'll get a message and verification email
6. After verification, log in again
7. You should be redirected to `/map` page
8. You should see your email and session timer in the header

## 🔐 Security Features Implemented

- ✅ Only one hardcoded email can access (set in .env.local)
- ✅ Email verification required
- ✅ 5-hour session with auto-logout
- ✅ Session expiry tracked in Firestore
- ✅ Protected routes redirect to login
- ✅ Firestore/Storage rules require authentication + verification

## 📝 Next Steps

Once authentication is working, we'll move to:
- **Step 3**: Map integration with location pins
- **Step 4**: Album management
- **Step 5**: Media upload
- **Step 6**: Slideshow and book animations

---

**Need help?** Let me know if you encounter any issues during Firebase setup!
