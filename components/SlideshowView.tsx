'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Media {
    id: string;
    url: string;
    fileName: string;
    fileType: string;
}

interface Music {
    id: string;
    fileName: string;
    url: string;
}

interface SlideshowViewProps {
    albumTitle: string;
    media: Media[];
    music: Music[];
    onClose: () => void;
}

export default function SlideshowView({ albumTitle, media, music, onClose }: SlideshowViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentMusicIndex, setCurrentMusicIndex] = useState(-1);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Auto-play random song on mount (with small delay to ensure user interaction)
    useEffect(() => {
        if (music.length > 0 && currentMusicIndex === -1) {
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * music.length);
                setCurrentMusicIndex(randomIndex);
                setIsPlaying(true);
            }, 100);
        }
    }, [music]);

    // Handle music playback
    useEffect(() => {
        if (!audioRef.current) return;

        if (currentMusicIndex >= 0 && music[currentMusicIndex]) {
            const audio = audioRef.current;
            const newSrc = music[currentMusicIndex].url;

            // Only update src if it's different
            if (audio.src !== newSrc) {
                // Pause current playback
                audio.pause();

                // Set new source
                audio.src = newSrc;
                audio.load();

                // Wait for audio to be ready, then play if needed
                if (isPlaying) {
                    const playWhenReady = () => {
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(err => {
                                if (err.name !== 'AbortError') {
                                    console.error('Playback error:', err);
                                }
                            });
                        }
                    };

                    // Try to play immediately, or wait for canplay event
                    if (audio.readyState >= 3) {
                        playWhenReady();
                    } else {
                        audio.addEventListener('canplay', playWhenReady, { once: true });
                    }
                }
            } else if (isPlaying && audio.paused) {
                // Same song, just resume if paused
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        if (err.name !== 'AbortError') {
                            console.error('Playback error:', err);
                        }
                    });
                }
            }
        }
    }, [currentMusicIndex, music, isPlaying]);

    useEffect(() => {
        if (!audioRef.current) return;

        const audio = audioRef.current;

        if (isPlaying && audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    if (err.name !== 'AbortError') {
                        console.error('Playback error:', err);
                    }
                });
            }
        } else if (!isPlaying && !audio.paused) {
            audio.pause();
        }
    }, [isPlaying]);

    // Auto-advance slideshow
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [currentIndex, media.length]);

    // Handle song end - play next or random
    const handleSongEnd = () => {
        if (music.length > 0) {
            const nextIndex = (currentMusicIndex + 1) % music.length;
            setCurrentMusicIndex(nextIndex);
        }
    };

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % media.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const selectSong = (index: number) => {
        setCurrentMusicIndex(index);
        setIsPlaying(true);
        setShowPlaylist(false);
    };

    const variants = {
        enter: (direction: number) => ({
            rotateY: direction > 0 ? 180 : -180,
            opacity: 0,
            scale: 0.8,
        }),
        center: {
            rotateY: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            rotateY: direction > 0 ? -180 : 180,
            opacity: 0,
            scale: 0.8,
        }),
    };

    if (media.length === 0) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-xl mb-4">No photos to display</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const currentMedia = media[currentIndex];

    return (
        <div className="fixed inset-0 bg-black z-50">
            {/* Audio Player */}
            <audio
                ref={audioRef}
                onEnded={handleSongEnd}
                className="hidden"
            />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-6 z-10">
                <div className="flex justify-between items-center">
                    <h1 className="text-white text-2xl font-bold">{albumTitle}</h1>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full h-full flex items-center justify-center p-20">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            rotateY: { type: 'spring', stiffness: 100, damping: 20 },
                            opacity: { duration: 0.3 },
                            scale: { duration: 0.3 },
                        }}
                        className="relative max-w-5xl max-h-full"
                        style={{ perspective: 1000 }}
                    >
                        {currentMedia.fileType.startsWith('image/') ? (
                            <img
                                src={currentMedia.url}
                                alt={currentMedia.fileName}
                                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
                            />
                        ) : (
                            <video
                                src={currentMedia.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl"
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-4 rounded-full transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-4 rounded-full transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Progress Indicator */}
                    <div className="flex justify-center gap-2 mb-4">
                        {media.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1 rounded-full transition-all ${index === currentIndex
                                    ? 'w-8 bg-white'
                                    : 'w-1 bg-white/40'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Music Player */}
                    {music.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={togglePlayPause}
                                        className="bg-white text-black p-3 rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        {isPlaying ? (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>

                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium truncate">
                                            {currentMusicIndex >= 0 && music[currentMusicIndex]
                                                ? music[currentMusicIndex].fileName.replace(/\.[^/.]+$/, '')
                                                : 'No song selected'}
                                        </p>
                                        <p className="text-white/60 text-xs">
                                            {currentIndex + 1} / {media.length} photos
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowPlaylist(!showPlaylist)}
                                    className="text-white hover:text-gray-300 transition-colors ml-4"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* Playlist */}
                            <AnimatePresence>
                                {showPlaylist && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 max-h-48 overflow-y-auto"
                                    >
                                        {music.map((song, index) => (
                                            <button
                                                key={song.id}
                                                onClick={() => selectSong(index)}
                                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${index === currentMusicIndex
                                                    ? 'bg-white/20 text-white'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                <p className="text-sm truncate">
                                                    {index === currentMusicIndex && '▶ '}
                                                    {song.fileName.replace(/\.[^/.]+$/, '')}
                                                </p>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
