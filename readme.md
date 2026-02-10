# 📖 Private Memory Map Book Website

## 1. Project Overview

This project is a **private, dual-user memory website** designed to store and relive photos and videos tied to **locations, dates, and events**.  
The experience is intentionally **intimate and emotional**, presented as a **storybook**, where each album is a **page**, and each location represents a **chapter**.

The website is **not public** and is accessible only by **two authorized account**.

---

## 2. Technology Stack (Mandatory)

- **Frontend Framework:** Next.js (React)
- **Hosting & Deployment:** Vercel
- **Authentication:** Firebase Authentication (Email + Email Verification)
- **Database:** Firebase Firestore
- **Media Storage:** Firebase Storage
- **Maps:** Mapbox or Google Maps API
- **Animations:** Framer Motion + CSS 3D Transforms
- **Audio Playback:** HTML5 Audio API

---

## 3. Authentication & Security Requirements

### 3.1 Login Rules

- The website supports **ONLY ONE USER**.
- The allowed email address is **hardcoded via environment variable**, not UI-configurable.
- Login requires:
  - Correct email
  - Correct password
  - Email verification

### 3.2 Email Verification (Critical)

- Every login must be verified via email.
- If email is not verified:
  - Access is blocked
  - Verification email is sent automatically

### 3.3 Session Expiry

- A successful login session lasts **exactly 5 hours**.
- After 5 hours:
  - User is logged out
  - Email re-verification is required
  - Session cannot be refreshed without verification
- Session expiry must be enforced:
  - On frontend
  - On Vercel API routes
  - Via timestamp validation

---

## 4. Deployment (Mandatory)

- The project must be deployed on **Vercel**.
- Use **Next.js API routes** as serverless functions.
- Sensitive values must be stored in **Vercel Environment Variables**:
  - Firebase credentials
  - Allowed email
  - Session duration

---

## 5. User Flow

### 5.1 Login Flow

1. User enters email and password
2. Email is checked against allowed email
3. Firebase authentication occurs
4. Verification email is sent if not verified
5. Upon verification:
   - Session starts
   - Session expiry timestamp is saved
6. User is redirected to the map view

---

### 5.2 Map View (Main Screen)

- Interactive map is displayed after login
- User can:
  - View existing pinned locations
  - Long-press or click map to add a new location pin

Each pinned location represents a **memory chapter**.

---

## 6. Location & Album Management

### 6.1 Location (Pin)

Each location contains:
- Latitude
- Longitude
- Location name
- Creation timestamp

---

### 6.2 Album (Page)

Each album belongs to a location and includes:
- Album title
- Event date
- Album description
- Cover image
- Background song (unique per album)
- Photos
- Videos

User must be able to:
- Create album
- Edit album details
- Delete album
- Add/remove photos and videos
- Reorder media inside album

---

## 7. Media Management Rules

- Media types:
  - Images (JPEG, PNG)
  - Videos (MP4)
  - Audio (MP3)
- All media must be stored in Firebase Storage
- Media access must be restricted to authenticated, verified user only

---

## 8. Memory Playback Mode

### 8.1 Slideshow Mode

- Photos auto-transition every 3–5 seconds
- User can tap/click to skip to next photo
- Videos play normally with controls
- Background song plays per album

### 8.2 Page Flip Navigation

- Swiping or tapping navigates between albums
- Each album behaves as a **book page**
- When page changes:
  - Previous song stops
  - New song starts
  - New slideshow loads

---

## 9. Book Animation Requirements (Very Important)

- Albums must be animated as **pages of a book**
- Page flip effect using:
  - CSS 3D transforms
  - Framer Motion
- Each album = one page
- Page turn must feel smooth, soft, and emotional
- Optional paper flip sound effect

---

## 10. Album Sorting & Navigation

- Albums must be sorted by:
  - Event date (default)
- Optional:
  - Newest to oldest
  - Oldest to newest
- Location-based grouping (chapters)

---

## 11. Database Structure (Firestore)

```plaintext
users
 └── userId
     ├── email
     ├── lastLogin
     ├── sessionExpiry

locations
 └── locationId
     ├── latitude
     ├── longitude
     ├── locationName
     ├── createdAt

albums
 └── albumId
     ├── locationId
     ├── title
     ├── description
     ├── eventDate
     ├── coverImageURL
     ├── backgroundSongURL
     ├── createdAt

media
 └── mediaId
     ├── albumId
     ├── type (photo | video)
     ├── fileURL
     ├── order
     ├── uploadedAt
12. API Routes (Next.js on Vercel)
/api/session-check

Validates Firebase token

Validates email verification

Validates session expiry

/api/reauth

Triggers email re-verification

/api/logout

Clears session and logs user out

13. Performance & UX Requirements
Lazy load images

Preload next album page

Smooth transitions between pages

Stop media playback on navigation

Responsive design (mobile-first)

14. Security Rules Summary
Firestore & Storage access:

Authenticated

Email verified

Active session only

No public reads

No anonymous access

15. Non-Goals
No public sharing

No multi-user support

No social features

No comments or likes

16. Project Philosophy
This website is not a gallery.
It is a private storybook of memories, designed to feel personal, slow, and emotional.

Every technical decision should prioritize:

Privacy

Simplicity

Emotional experience

Longevity

17. Final Instruction to AI
Build this project exactly as specified above.
Do not add extra users, public access, or features not listed.
Prioritize correctness, security, and smooth animation.


---

If you want next:
- I can **compress this into an AI prompt**
- Or split it into **Backend / Frontend prompts**
- Or generate a **project folder structure**
- Or write **Firebase rules + Vercel config**

Just say which one ✨