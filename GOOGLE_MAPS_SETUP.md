# 🗺️ Google Maps Setup Guide

## ✅ Step 1: Get Your Google Maps API Key

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select a Project
- Click on the project dropdown (top left)
- Click "New Project"
- Name it "page-of-us" or anything you like
- Click "Create"

### 3. Enable Maps JavaScript API
- In the search bar, type "Maps JavaScript API"
- Click on "Maps JavaScript API"
- Click "Enable"

### 4. Create API Key
- Go to "Credentials" (left sidebar)
- Click "+ CREATE CREDENTIALS"
- Select "API key"
- **Copy the API key** (starts with `AIza...`)

### 5. (Optional) Restrict the API Key
For security, you can restrict the key:
- Click on the key you just created
- Under "Application restrictions":
  - Select "HTTP referrers (web sites)"
  - Add: `http://localhost:*` and `https://yourdomain.com/*`
- Under "API restrictions":
  - Select "Restrict key"
  - Choose "Maps JavaScript API"
- Click "Save"

---

## ✅ Step 2: Add API Key to Your Project

1. Open `.env.local` file
2. Find the line:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
   ```
3. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key
4. Save the file

Example:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyABC123...your-actual-key
```

---

## ✅ Step 3: Restart Dev Server

1. Stop the dev server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. Open http://localhost:3001 (or whatever port it shows)

---

## 🎉 You're Done!

You should now see Google Maps instead of the black screen!

### Features:
- ✅ Click anywhere to add a location
- ✅ Click markers to view details
- ✅ Delete locations
- ✅ All data saved to Firebase

---

## 💰 Pricing (Don't Worry!)

Google Maps has a **FREE tier**:
- $200 free credit per month
- That's about **28,000 map loads per month**
- Perfect for a personal project!

You won't be charged unless you exceed the free tier.

---

## 🐛 Troubleshooting

**If you see "For development purposes only" watermark:**
- This means the API key is working but not restricted
- It's fine for development
- You can restrict it later for production

**If the map doesn't load:**
- Check browser console for errors
- Make sure the API key is correct in `.env.local`
- Make sure "Maps JavaScript API" is enabled
- Restart the dev server

---

## 📝 Next Steps

Once the map is working, we'll add:
1. Search functionality
2. Album management for each location
3. Photo/video uploads
4. Slideshow mode

Let me know when you have the API key and I'll help you test it! 🚀
