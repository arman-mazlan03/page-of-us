# Multi-User Shared Access System

## Overview
This system allows multiple users (emails) to access and manage the same content - locations, albums, photos, videos, and music.

## Architecture

### Database Structure

#### 1. Workspaces Collection
```javascript
workspaces/{workspaceId}
  - name: "Our Memories" 
  - createdBy: "user-id"
  - createdAt: "timestamp"
  - members: ["email1@example.com", "email2@example.com"]
```

#### 2. Updated Collections
All existing collections will add a `workspaceId` field:

```javascript
locations/{locationId}
  - workspaceId: "workspace-id"  // NEW
  - userId: "user-id"  // Keep for backward compatibility
  - name: "Paris"
  - ...

albums/{albumId}
  - workspaceId: "workspace-id"  // NEW
  - userId: "user-id"  // Keep for backward compatibility
  - ...

media/{mediaId}
  - workspaceId: "workspace-id"  // NEW
  - userId: "user-id"  // Keep for backward compatibility
  - ...

music/{musicId}
  - workspaceId: "workspace-id"  // NEW
  - userId: "user-id"  // Keep for backward compatibility
  - ...
```

#### 3. User Profiles Collection
```javascript
users/{userId}
  - email: "user@example.com"
  - displayName: "John Doe"
  - workspaceId: "workspace-id"
  - createdAt: "timestamp"
```

## Implementation Options

### Option 1: Single Shared Workspace (Recommended for Couples)
- All users share ONE workspace
- Everyone sees the same content
- Any user can add/edit/delete
- Simple and straightforward

**Best for:**
- Couples
- Small families
- Close friends

### Option 2: Multiple Workspaces per User
- Users can belong to multiple workspaces
- Switch between workspaces
- More complex but more flexible

**Best for:**
- Families with different groups
- Users who want separate personal/shared spaces

## Features

### What Users Can Do:

1. **View Content**
   - All members see all locations
   - All members see all albums
   - All members see all photos/videos
   - All members hear all music

2. **Add Content**
   - Any member can add locations
   - Any member can create albums
   - Any member can upload media
   - Any member can upload music

3. **Edit Content**
   - Any member can edit albums
   - Any member can update locations
   - Any member can organize content

4. **Delete Content**
   - Any member can delete content
   - (Optional: Can add permission levels)

### Workspace Management:

1. **Invite Members**
   - Add email addresses
   - Send invitation links
   - Members auto-join on first login

2. **Remove Members**
   - Owner can remove members
   - Removed members lose access

3. **Transfer Ownership**
   - Change workspace owner
   - Ensure continuity

## Migration Strategy

### For Existing Users:

1. **Auto-create workspace** on first login after update
2. **Migrate existing data** to workspace
3. **Invite other users** to join

### Steps:
```
1. User logs in
2. Check if user has workspace
3. If no workspace:
   - Create new workspace
   - Set user as owner
   - Migrate all user's data to workspace
4. If has workspace:
   - Load workspace data
```

## Security Considerations

### Firestore Rules:
```javascript
// Only workspace members can read/write
match /locations/{locationId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/workspaces/$(resource.data.workspaceId))
      .data.members.hasAny([request.auth.token.email]);
}
```

### Privacy:
- Users only see their workspace content
- No cross-workspace access
- Secure member verification

## UI Changes Needed

### 1. Settings Page
- Workspace name
- Member list
- Invite members
- Remove members

### 2. Login Flow
- Check workspace membership
- Auto-create workspace if needed
- Migrate data if needed

### 3. Header/Navigation
- Show workspace name
- Show member count
- Link to settings

## Implementation Priority

### Phase 1: Core Multi-User (Recommended First)
1. Create workspace system
2. Add workspaceId to all collections
3. Update queries to filter by workspaceId
4. Auto-create workspace for existing users
5. Add member invitation system

### Phase 2: Enhanced Features
1. Permission levels (owner, editor, viewer)
2. Activity log (who added what)
3. Member profiles with avatars
4. Workspace switching (if multiple workspaces)

### Phase 3: Advanced Features
1. Real-time collaboration indicators
2. Comments on photos
3. Shared notifications
4. Member activity feed

## Example Use Cases

### Couple Sharing Memories:
```
User A (alice@example.com):
  - Creates account
  - Uploads photos from trip
  - Invites bob@example.com

User B (bob@example.com):
  - Creates account with invitation
  - Sees all of Alice's photos
  - Adds his own photos
  - Both see combined memories
```

### Family Album:
```
Parents:
  - Create workspace "Family Memories"
  - Invite children's emails
  
All Family Members:
  - See all family photos
  - Add photos from events
  - Create albums together
  - Share music playlists
```

## Next Steps

Would you like me to implement:

1. **Option A: Simple Shared Workspace** (Recommended)
   - Single workspace per user
   - Invite members by email
   - All members have equal access
   - Quick to implement (~30 minutes)

2. **Option B: Advanced Multi-Workspace**
   - Multiple workspaces per user
   - Workspace switching
   - Permission levels
   - More complex (~2 hours)

Let me know which option you prefer, and I'll implement it!
