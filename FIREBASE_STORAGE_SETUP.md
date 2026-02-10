# 🔥 Firebase Storage Setup

## ⚠️ Important: Enable Firebase Storage

Before you can upload media, you need to enable Firebase Storage in your Firebase Console.

### Step 1: Enable Firebase Storage

1. Go to https://console.firebase.google.com/
2. Select your project: **page-of-us**
3. Click on **"Storage"** in the left sidebar
4. Click **"Get Started"**
5. Click **"Next"** (keep default settings)
6. Click **"Done"**

---

### Step 2: Set Storage Rules

For security, we need to set up storage rules so only authenticated users can upload/delete media.

1. In Firebase Console, go to **Storage** → **Rules** tab
2. Replace the rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Album media (photos/videos)
    match /albums/{albumId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Album custom thumbnails
    match /album-thumbnails/{albumId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Album background music
    match /album-music/{albumId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

---

### Step 3: Test Upload

1. **Refresh your browser** at http://localhost:3001
2. **Go to an album** (create one if you haven't)
3. **Drag and drop** a photo or click to browse
4. **Watch the upload progress!**

---

## ✅ What You Can Do Now:

### Upload Media
- **Drag & drop** photos/videos onto the upload area
- **Click** to browse and select files
- **Multiple files** at once
- **Progress bar** for each upload
- **Automatic save** to Firebase Storage & Firestore

### View Media
- **Grid layout** of all photos/videos
- **Video indicator** (play button overlay)
- **Hover effects** with filename
- **Click** to open lightbox

### Lightbox Viewer
- **Full-screen view** of photos/videos
- **Video playback** with controls
- **Navigate** with arrow buttons or keyboard
- **Download** media
- **Delete** media
- **Counter** showing position (e.g., "3 / 10")

---

## 📊 Supported Formats:

### Images
- JPG, JPEG
- PNG
- GIF
- WebP

### Videos
- MP4
- MOV
- AVI
- WebM

### File Size Limit
- **Maximum: 100MB** per file

---

## 🐛 Troubleshooting:

**Upload fails with "Permission denied":**
- Make sure you've set the Storage Rules correctly
- Make sure you're logged in
- Wait a few minutes for rules to propagate

**Upload is slow:**
- Large files take time
- Check your internet connection
- Try a smaller file first

**Video doesn't play:**
- Make sure it's a supported format (MP4 recommended)
- Try converting to MP4 using a free online converter

---

## 🎉 You're All Set!

Once Storage is enabled and rules are set, you can upload unlimited photos and videos to your memory albums!

**Next Step:** We'll add slideshow mode and book page animations! 📖✨
