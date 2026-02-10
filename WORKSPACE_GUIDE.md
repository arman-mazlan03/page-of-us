# 🤝 Simple Multi-User Setup Guide

## Overview
This is a **hardcoded whitelist** system. You simply add emails to `.env.local` and those users can access the shared workspace.

---

## 🚀 Quick Setup

### Step 1: Add Allowed Emails

Edit `.env.local` file:

```bash
# Add all emails that should have access (comma-separated)
NEXT_PUBLIC_ALLOWED_EMAILS=your-email@gmail.com,partner@gmail.com,friend@gmail.com

# Single workspace ID (all users share this)
NEXT_PUBLIC_WORKSPACE_ID=shared_workspace_main
```

### Step 2: Restart Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### Step 3: Migrate Existing Data

1. Go to: `http://localhost:3001/migrate-workspace`
2. Click "🚀 Start Migration"
3. Done! All data now has workspaceId

### Step 4: Users Log In

- Each user creates account / logs in with their email
- If their email is in the allowed list, they get access
- All users see the same content!

---

## ✅ What This Does

### All Allowed Users:
- ✅ See all locations
- ✅ See all albums
- ✅ See all photos/videos
- ✅ Hear all music
- ✅ Can add content
- ✅ Can edit content
- ✅ Can delete content

### Same Workspace:
- Everyone shares `NEXT_PUBLIC_WORKSPACE_ID`
- All data filtered by this workspace ID
- No separate workspaces
- Simple and straightforward

---

## 📝 Adding/Removing Users

### To Add a User:

1. Edit `.env.local`
2. Add email to `NEXT_PUBLIC_ALLOWED_EMAILS`
3. Restart server
4. Tell them to log in

**Example:**
```bash
# Before
NEXT_PUBLIC_ALLOWED_EMAILS=you@gmail.com

# After (add partner)
NEXT_PUBLIC_ALLOWED_EMAILS=you@gmail.com,partner@gmail.com
```

### To Remove a User:

1. Edit `.env.local`
2. Remove email from `NEXT_PUBLIC_ALLOWED_EMAILS`
3. Restart server
4. They can no longer access

---

## 🔐 How It Works

### Login Flow:
```
User logs in
  ↓
Check if email in NEXT_PUBLIC_ALLOWED_EMAILS
  ↓
If YES:
  - Load shared workspace
  - Show all content
  ↓
If NO:
  - Access denied
  - (They can still log in but see nothing)
```

### Data Access:
```
All data has: workspaceId = "shared_workspace_main"
  ↓
All queries filter by: workspaceId
  ↓
All allowed users see same data
```

---

## 🎯 Example Setup

### For a Couple:

**.env.local:**
```bash
NEXT_PUBLIC_ALLOWED_EMAILS=alice@gmail.com,bob@gmail.com
NEXT_PUBLIC_WORKSPACE_ID=our_memories
```

**Result:**
- Alice logs in → Sees everything
- Bob logs in → Sees everything
- Both can add/edit content
- Both see each other's additions

---

### For a Family:

**.env.local:**
```bash
NEXT_PUBLIC_ALLOWED_EMAILS=dad@gmail.com,mom@gmail.com,son@gmail.com,daughter@gmail.com
NEXT_PUBLIC_WORKSPACE_ID=family_memories
```

**Result:**
- All 4 family members share workspace
- Everyone sees all family photos
- Anyone can add new memories
- One shared collection

---

## ⚙️ Settings Page

Access at: `http://localhost:3001/settings`

**Shows:**
- Workspace name
- List of authorized users
- Migration button

**Note:** 
- No invite/remove buttons
- To change users, edit `.env.local`
- Simpler and more direct

---

## 🔄 Migration

**Important:** Run migration once after setup!

**What it does:**
- Adds `workspaceId` to all locations
- Adds `workspaceId` to all albums
- Adds `workspaceId` to all media
- Adds `workspaceId` to all music

**When to run:**
- After first setup
- When you have existing data
- Only need to run once

---

## 🎨 No Invitation System

**What's Different:**
- ❌ No invitation forms
- ❌ No email invites
- ❌ No member management UI
- ✅ Just edit `.env.local`
- ✅ Restart server
- ✅ Done!

**Benefits:**
- Simpler code
- Easier to manage
- Direct control
- No database updates needed

---

## 📊 Current Setup

**Your current config:**
```bash
NEXT_PUBLIC_ALLOWED_EMAILS=armanmazlan03@gmail.com
NEXT_PUBLIC_WORKSPACE_ID=shared_workspace_main
```

**To add someone:**
```bash
# Add their email
NEXT_PUBLIC_ALLOWED_EMAILS=armanmazlan03@gmail.com,partner@example.com
```

**Then:**
1. Restart server
2. They log in
3. They see everything!

---

## ✅ Checklist

- [ ] Edit `.env.local` with allowed emails
- [ ] Restart server
- [ ] Go to `/migrate-workspace`
- [ ] Click "Start Migration"
- [ ] Tell others to log in
- [ ] Everyone sees shared content!

---

## 🎉 That's It!

**Much simpler than invitation system:**
- No complex UI
- No database management
- Just environment variables
- Perfect for dedicated personal use

**Perfect for:**
- Couples
- Small families
- Close friend groups
- Personal shared spaces

---

**Enjoy your shared workspace!** 🤝📖✨
