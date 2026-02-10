# 📖 Page Flip Effect for All Memories

## Overview

Transform the "All Memories" page into an interactive photo album with realistic page-turning effects using the `react-pageflip` library.

---

## Installation

```bash
npm install react-pageflip
```

---

## Implementation Plan

### Current "All Memories" Page:
- Grid layout of photos
- Simple slideshow view
- Basic navigation

### New Page Flip Design:
- Realistic book/album effect
- Page-turning animation
- Touch/swipe support
- Mobile-friendly

---

## Step 1: Install the Library

Run this command:
```bash
npm install react-pageflip
```

---

## Step 2: Create FlipBook Component

**File:** `components/FlipBookView.tsx`

```tsx
'use client';

import React, { useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

interface Media {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    albumTitle?: string;
    eventDate?: string;
}

interface FlipBookViewProps {
    media: Media[];
    onClose: () => void;
}

export default function FlipBookView({ media, onClose }: FlipBookViewProps) {
    const bookRef = useRef<any>(null);

    // Group media into pages (2 photos per page)
    const pages: Media[][] = [];
    for (let i = 0; i < media.length; i += 2) {
        pages.push(media.slice(i, i + 2));
    }

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
            >
                ✕
            </button>

            {/* Navigation Buttons */}
            <button
                onClick={() => bookRef.current?.pageFlip().flipPrev()}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white px-4 py-8 rounded-lg z-10"
            >
                ←
            </button>

            <button
                onClick={() => bookRef.current?.pageFlip().flipNext()}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white px-4 py-8 rounded-lg z-10"
            >
                →
            </button>

            {/* Flip Book */}
            <HTMLFlipBook
                ref={bookRef}
                width={400}
                height={600}
                size="stretch"
                minWidth={315}
                maxWidth={1000}
                minHeight={400}
                maxHeight={1533}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                className="flip-book"
            >
                {/* Cover Page */}
                <div className="page bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                    <div className="text-center text-white">
                        <h1 className="text-4xl font-bold mb-4">Our Memories</h1>
                        <p className="text-xl">{media.length} Photos</p>
                    </div>
                </div>

                {/* Photo Pages */}
                {pages.map((pagePair, pageIndex) => (
                    <div key={pageIndex} className="page bg-white p-8">
                        <div className="h-full flex flex-col gap-4">
                            {pagePair.map((item) => (
                                <div key={item.id} className="flex-1 flex flex-col">
                                    {item.type === 'image' ? (
                                        <img
                                            src={item.url}
                                            alt={item.caption || 'Memory'}
                                            className="w-full h-full object-cover rounded-lg shadow-lg"
                                        />
                                    ) : (
                                        <video
                                            src={item.url}
                                            controls
                                            className="w-full h-full object-cover rounded-lg shadow-lg"
                                        />
                                    )}
                                    {item.caption && (
                                        <p className="text-sm text-gray-700 mt-2 text-center italic">
                                            {item.caption}
                                        </p>
                                    )}
                                    {item.albumTitle && (
                                        <p className="text-xs text-gray-500 text-center">
                                            {item.albumTitle}
                                            {item.eventDate && ` • ${new Date(item.eventDate).toLocaleDateString()}`}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Back Cover */}
                <div className="page bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
                    <div className="text-center text-white">
                        <h2 className="text-3xl font-bold">The End</h2>
                        <p className="text-lg mt-4">More memories to come...</p>
                    </div>
                </div>
            </HTMLFlipBook>

            {/* Page Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                Swipe or click arrows to flip pages
            </div>
        </div>
    );
}
```

---

## Step 3: Add CSS Styles

**File:** `app/globals.css`

Add this at the end:

```css
/* Page Flip Styles */
.flip-book {
    box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.5);
}

.page {
    background-color: white;
    color: #333;
    border: 1px solid #ccc;
    overflow: hidden;
}

.page img,
.page video {
    user-select: none;
    -webkit-user-drag: none;
}

/* Prevent text selection during flip */
.flip-book * {
    user-select: none;
}
```

---

## Step 4: Update All Memories Page

**File:** `app/memories/page.tsx`

Add the FlipBook view option:

```tsx
'use client';

import { useState } from 'react';
import FlipBookView from '@/components/FlipBookView';
// ... existing imports

export default function AllMemoriesPage() {
    const [showFlipBook, setShowFlipBook] = useState(false);
    // ... existing code

    return (
        <div>
            {/* Add button to switch to flip book view */}
            <button
                onClick={() => setShowFlipBook(true)}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg"
            >
                📖 View as Flip Book
            </button>

            {/* Existing grid view */}
            {/* ... */}

            {/* Flip Book View */}
            {showFlipBook && (
                <FlipBookView
                    media={allMedia}
                    onClose={() => setShowFlipBook(false)}
                />
            )}
        </div>
    );
}
```

---

## Features

### ✅ Realistic Page Flip
- Smooth page-turning animation
- 3D effect with shadows
- Natural physics

### ✅ Touch Support
- Swipe to flip pages
- Pinch to zoom (optional)
- Mobile-friendly

### ✅ Navigation
- Arrow buttons
- Keyboard arrows
- Click/tap on edges

### ✅ Customizable
- Adjustable page size
- Custom cover design
- Flexible layout

---

## Configuration Options

```tsx
<HTMLFlipBook
    width={400}              // Page width
    height={600}             // Page height
    size="stretch"           // "fixed" or "stretch"
    minWidth={315}           // Minimum width
    maxWidth={1000}          // Maximum width
    showCover={true}         // Show cover page
    mobileScrollSupport={true} // Enable mobile scrolling
    swipeDistance={30}       // Swipe sensitivity
    clickEventForward={true} // Forward click events
    usePortrait={true}       // Portrait mode on mobile
    startPage={0}            // Starting page
    drawShadow={true}        // Draw page shadows
    flippingTime={1000}      // Animation duration (ms)
    useMouseEvents={true}    // Enable mouse events
    maxShadowOpacity={0.5}   // Shadow opacity
/>
```

---

## Advanced Features

### 1. Page Templates

```tsx
// Different page layouts
const PageTemplate1 = ({ photo }) => (
    <div className="page p-8">
        <img src={photo.url} className="w-full h-full object-cover" />
    </div>
);

const PageTemplate2 = ({ photos }) => (
    <div className="page p-4 grid grid-cols-2 gap-2">
        {photos.map(photo => (
            <img key={photo.id} src={photo.url} className="w-full h-full object-cover" />
        ))}
    </div>
);
```

### 2. Sound Effects

```tsx
const flipSound = new Audio('/sounds/page-flip.mp3');

<HTMLFlipBook
    onFlip={(e) => {
        flipSound.play();
    }}
/>
```

### 3. Bookmarks

```tsx
const [bookmarks, setBookmarks] = useState<number[]>([]);

const toggleBookmark = (pageIndex: number) => {
    setBookmarks(prev =>
        prev.includes(pageIndex)
            ? prev.filter(p => p !== pageIndex)
            : [...prev, pageIndex]
    );
};
```

---

## Mobile Optimization

```tsx
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

<HTMLFlipBook
    width={isMobile ? 300 : 400}
    height={isMobile ? 450 : 600}
    mobileScrollSupport={true}
    usePortrait={true}
    swipeDistance={30}
/>
```

---

## Summary

**What you'll get:**
- ✅ Beautiful page-flip effect
- ✅ Interactive photo album
- ✅ Touch/swipe support
- ✅ Mobile-friendly
- ✅ Customizable design

**Installation:**
```bash
npm install react-pageflip
```

**Next steps:**
1. Install the library
2. Create FlipBookView component
3. Add CSS styles
4. Update All Memories page
5. Test and customize!

---

**Ready to implement? Let me know and I'll create the files for you!** 📖✨
