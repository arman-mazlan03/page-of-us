'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';

interface Album {
    id: string;
    locationId: string;
    locationName: string;
    title: string;
    description: string;
    eventDate: string;
    createdAt: string;
}

interface Media {
    id: string;
    albumId: string;
    fileName: string;
    fileType: string;
    url: string;
    createdAt: string;
}

interface AlbumWithMedia {
    album: Album;
    media: Media[];
}

interface FlipBookViewProps {
    albums: AlbumWithMedia[];
    onClose: () => void;
}

export default function FlipBookView({ albums, onClose }: FlipBookViewProps) {
    const bookRef = useRef<any>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Generate pages dynamically - useMemo to stabilize for useEffect
    const pages = useMemo(() => {
        const p: any[] = [];

        // 1. App Cover Page
        const totalPhotos = albums.reduce((acc, curr) => acc + curr.media.length, 0);
        p.push({ type: 'app-cover', totalPhotos });

        albums.forEach(albumData => {
            // 2. Album Intro Page
            p.push({ type: 'album-intro', album: albumData.album });

            // 3. Media Pages (1 per page)
            albumData.media.forEach(m => {
                p.push({ type: 'media', data: m });
            });
        });

        // 4. Back Cover
        p.push({ type: 'back-cover' });

        return p;
    }, [albums]);

    const handleFlip = (e: any) => {
        setCurrentPage(e.data);
    };

    // Auto-advance logic
    useEffect(() => {
        if (!bookRef.current || !pages[currentPage]) return;

        const currentPageData = pages[currentPage];
        let timer: NodeJS.Timeout;

        // Auto-flip for image pages
        if (currentPageData.type === 'media') {
            const item = currentPageData.data as Media;

            if (item.fileType.startsWith('image/')) {
                // Determine display time (3s for images)
                timer = setTimeout(() => {
                    // Only flip if not the last page
                    if (currentPage < pages.length - 1) {
                        bookRef.current.pageFlip().flipNext();
                    }
                }, 3000);
            }
            // For videos, we handle onEnded event directly in the video element
        }
        // Auto-flip for cover/intro pages (optional, let's keep it manual or longer delay? User asked for "if it is photos" / videos)
        // User implied auto-flip content. Let's stick to photos/videos for now, or maybe 5s for intro?
        // I'll leave intro/cover manual for now as they contain text to read.

        return () => clearTimeout(timer);
    }, [currentPage, pages]);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-50 flex items-center justify-center p-4">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-8 md:right-8 text-white/80 hover:text-white text-3xl md:text-4xl z-20 transition-colors"
                title="Close"
            >
                ✕
            </button>

            {/* Navigation Buttons */}
            <button
                onClick={() => bookRef.current?.pageFlip().flipPrev()}
                className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 md:px-4 py-6 md:py-8 rounded-lg z-20 transition-all hover:scale-110"
                title="Previous Page"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button
                onClick={() => bookRef.current?.pageFlip().flipNext()}
                className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 md:px-4 py-6 md:py-8 rounded-lg z-20 transition-all hover:scale-110"
                title="Next Page"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Flip Book Container */}
            <div className="flex items-center justify-center w-full h-full">
                <HTMLFlipBook
                    ref={bookRef}
                    width={450}
                    height={650}
                    size="stretch"
                    minWidth={300}
                    maxWidth={600}
                    minHeight={400}
                    maxHeight={800}
                    maxShadowOpacity={0.4}
                    showCover={true}
                    mobileScrollSupport={true}
                    className="flip-book shadow-2xl"
                    onFlip={handleFlip}
                    onInit={(e: any) => setTotalPages(e.data)}
                    style={{}}
                    startPage={0}
                    drawShadow={true}
                    flippingTime={1000}
                    usePortrait={true}
                    startZIndex={0}
                    autoSize={true}
                    clickEventForward={true}
                    useMouseEvents={true}
                    swipeDistance={30}
                    showPageCorners={true}
                    disableFlipByClick={false}
                >
                    {pages.map((page, index) => {
                        // App Cover
                        if (page.type === 'app-cover') {
                            return (
                                <div key={index} className="page">
                                    <div className="w-full h-full bg-gradient-to-br from-rose-400 via-pink-500 to-purple-500 flex flex-col items-center justify-center p-8 text-white">
                                        <div className="text-center space-y-6">
                                            <div className="text-6xl mb-4">📖</div>
                                            <h1 className="text-4xl md:text-5xl font-bold mb-2">Our Memories</h1>
                                            <div className="w-24 h-1 bg-white/50 mx-auto rounded-full"></div>
                                            <p className="text-xl md:text-2xl font-light">{page.totalPhotos} Photos</p>
                                            <p className="text-sm md:text-base opacity-80 mt-8">Swipe or click to flip pages</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Album Intro Page
                        if (page.type === 'album-intro') {
                            const album = page.album as Album;
                            return (
                                <div key={index} className="page">
                                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-8 text-slate-800 border-4 border-double border-slate-200">
                                        <div className="text-center space-y-6">
                                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-2xl">📸</span>
                                            </div>
                                            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900">{album.title}</h2>
                                            <div className="w-12 h-1 bg-rose-300 mx-auto"></div>
                                            <div className="space-y-2 text-sm md:text-base text-slate-600">
                                                <p className="flex items-center justify-center gap-2">
                                                    📅 {new Date(album.eventDate).toLocaleDateString(undefined, {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <p className="flex items-center justify-center gap-2">
                                                    📍 {album.locationName}
                                                </p>
                                            </div>
                                            {album.description && (
                                                <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-slate-100 max-w-xs mx-auto transform rotate-1">
                                                    <p className="italic font-serif text-slate-600 leading-relaxed">
                                                        "{album.description}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Media Page (Photo/Video)
                        if (page.type === 'media') {
                            const item = page.data as Media;
                            return (
                                <div key={index} className="page">
                                    <div className="w-full h-full bg-white flex items-center justify-center relative group p-4 border border-gray-100">
                                        {/* Full size media */}
                                        {item.fileType.startsWith('image/') ? (
                                            <img
                                                src={item.url}
                                                alt="Memory"
                                                className="w-full h-full object-contain filter drop-shadow-xl"
                                                draggable={false}
                                            />
                                        ) : (
                                            <video
                                                src={item.url}
                                                controls
                                                autoPlay
                                                muted={false} // Allow audio if user wants, but autoplay might require mute. Mobile restricts autoplay.
                                                // User wants auto-flip ON END.
                                                onEnded={() => {
                                                    if (currentPage < pages.length - 1) {
                                                        bookRef.current?.pageFlip().flipNext();
                                                    }
                                                }}
                                                className="w-full h-full object-contain filter drop-shadow-xl"
                                            />
                                        )}

                                        {/* Page Number */}
                                        <div className="absolute bottom-4 right-4 text-gray-400 text-xs">
                                            {index + 1}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Back Cover
                        if (page.type === 'back-cover') {
                            return (
                                <div key={index} className="page">
                                    <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-400 flex flex-col items-center justify-center p-8 text-white">
                                        <div className="text-center space-y-6">
                                            <div className="text-6xl mb-4">💝</div>
                                            <h2 className="text-3xl md:text-4xl font-bold">The End</h2>
                                            <div className="w-24 h-1 bg-white/50 mx-auto rounded-full"></div>
                                            <p className="text-lg md:text-xl font-light">More memories to come...</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })}
                </HTMLFlipBook>
            </div>

            {/* Page Counter */}
            <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                {currentPage + 1} / {pages.length}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 text-white/60 text-xs md:text-sm text-center">
                <p className="hidden md:block">Use arrow keys or click edges to flip pages</p>
                <p className="md:hidden">Swipe to flip pages</p>
                <p className="mt-2 text-xs opacity-75">Auto-playing...</p>
            </div>
        </div>
    );
}
