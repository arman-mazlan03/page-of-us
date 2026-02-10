'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Album {
    id: string;
    locationId: string;
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

interface Music {
    id: string;
    albumId: string;
    fileName: string;
    url: string;
}

interface AlbumWithMedia {
    album: Album;
    media: Media[];
}

function MemoriesPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [albums, setAlbums] = useState<AlbumWithMedia[]>([]);
    const [allMusic, setAllMusic] = useState<Music[]>([]);
    const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentMusicIndex, setCurrentMusicIndex] = useState(-1);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [locationName, setLocationName] = useState('');
    const [videoEnded, setVideoEnded] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const locationId = params.locationId as string;

    useEffect(() => {
        loadMemories();
    }, [locationId, user]);

    // Auto-select random song on mount (but don't play until user starts)
    useEffect(() => {
        if (allMusic.length > 0 && currentMusicIndex === -1) {
            const randomIndex = Math.floor(Math.random() * allMusic.length);
            setCurrentMusicIndex(randomIndex);
        }
    }, [allMusic]);

    // Handle music playback
    useEffect(() => {
        if (!audioRef.current || !hasStarted) return;

        if (currentMusicIndex >= 0 && allMusic[currentMusicIndex]) {
            const audio = audioRef.current;
            const newSrc = allMusic[currentMusicIndex].url;

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
    }, [currentMusicIndex, allMusic, hasStarted, isPlaying]);

    useEffect(() => {
        if (!audioRef.current || !hasStarted) return;

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
    }, [isPlaying, hasStarted]);

    const startExperience = () => {
        setHasStarted(true);
        setIsPlaying(true);
    };

    const loadMemories = async () => {
        if (!user || !locationId) return;

        try {
            setIsLoading(true);

            // Get location name
            const locationDoc = await getDocs(query(collection(db, 'locations'), where('__name__', '==', locationId)));
            if (!locationDoc.empty) {
                setLocationName(locationDoc.docs[0].data().locationName);
            }

            // Get all albums for this location, sorted by event date
            const albumsQuery = query(
                collection(db, 'albums'),
                where('locationId', '==', locationId),
                orderBy('eventDate', 'asc')
            );
            const albumsSnapshot = await getDocs(albumsQuery);
            const albumsList: AlbumWithMedia[] = [];

            // For each album, get media
            for (const albumDoc of albumsSnapshot.docs) {
                const albumData = { id: albumDoc.id, ...albumDoc.data() } as Album;

                // Get media for this album
                const mediaQuery = query(
                    collection(db, 'media'),
                    where('albumId', '==', albumData.id),
                    orderBy('createdAt', 'asc')
                );
                const mediaSnapshot = await getDocs(mediaQuery);
                const mediaList: Media[] = [];
                mediaSnapshot.forEach((doc) => {
                    mediaList.push({ id: doc.id, ...doc.data() } as Media);
                });

                // Only add album if it has media
                if (mediaList.length > 0) {
                    albumsList.push({ album: albumData, media: mediaList });
                }
            }

            // Get ALL music for this user (global music library)
            const musicQuery = query(
                collection(db, 'music'),
                where('userId', '==', user.uid)
            );
            const musicSnapshot = await getDocs(musicQuery);
            const musicList: Music[] = [];
            musicSnapshot.forEach((doc) => {
                musicList.push({ id: doc.id, ...doc.data() } as Music);
            });

            setAlbums(albumsList);
            setAllMusic(musicList);
        } catch (error) {
            console.error('Error loading memories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSongEnd = () => {
        if (allMusic.length > 0) {
            const nextIndex = (currentMusicIndex + 1) % allMusic.length;
            setCurrentMusicIndex(nextIndex);
        }
    };

    const selectSong = (index: number) => {
        setCurrentMusicIndex(index);
        setIsPlaying(true);
        setShowPlaylist(false);
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleVideoEnd = () => {
        setVideoEnded(true);
        // Auto-advance after video ends
        setTimeout(() => {
            goToNext();
        }, 500);
    };

    const goToNext = () => {
        const currentAlbum = albums[currentAlbumIndex];
        if (currentMediaIndex < currentAlbum.media.length - 1) {
            // Next photo in same album
            setCurrentMediaIndex(currentMediaIndex + 1);
            setVideoEnded(false);
        } else if (currentAlbumIndex < albums.length - 1) {
            // Move to next album
            setCurrentAlbumIndex(currentAlbumIndex + 1);
            setCurrentMediaIndex(0);
            setVideoEnded(false);
        }
    };

    const goToPrevious = () => {
        if (currentMediaIndex > 0) {
            // Previous photo in same album
            setCurrentMediaIndex(currentMediaIndex - 1);
            setVideoEnded(false);
        } else if (currentAlbumIndex > 0) {
            // Move to previous album, last photo
            setCurrentAlbumIndex(currentAlbumIndex - 1);
            const prevAlbum = albums[currentAlbumIndex - 1];
            setCurrentMediaIndex(prevAlbum.media.length - 1);
            setVideoEnded(false);
        }
    };

    const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const halfWidth = rect.width / 2;

        if (clickX < halfWidth) {
            // Clicked left side - go to previous
            goToPrevious();
        } else {
            // Clicked right side - go to next (allow even during video)
            goToNext();
        }
    };

    // Auto-advance timer for images (3 seconds)
    useEffect(() => {
        if (!hasStarted) return;

        const currentAlbum = albums[currentAlbumIndex];
        const currentMedia = currentAlbum.media[currentMediaIndex];

        // Only auto-advance for images, not videos
        if (currentMedia.fileType.startsWith('image/') && videoEnded) {
            const timer = setTimeout(() => {
                goToNext();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [currentAlbumIndex, currentMediaIndex, hasStarted, videoEnded, albums]);

    const nextAlbum = () => {
        if (currentAlbumIndex < albums.length - 1) {
            setCurrentAlbumIndex(currentAlbumIndex + 1);
            setCurrentMediaIndex(0);
            setVideoEnded(false);
        }
    };

    const prevAlbum = () => {
        if (currentAlbumIndex > 0) {
            setCurrentAlbumIndex(currentAlbumIndex - 1);
            setCurrentMediaIndex(0);
            setVideoEnded(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">📖</div>
                    <p className="text-xl text-gray-700">Loading memories...</p>
                </div>
            </div>
        );
    }

    if (albums.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-xl text-gray-700 mb-4">No memories yet</p>
                    <button
                        onClick={() => router.push(`/location/${locationId}/albums`)}
                        className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all"
                    >
                        Create Your First Album
                    </button>
                </div>
            </div>
        );
    }

    const currentAlbum = albums[currentAlbumIndex];
    const currentMedia = currentAlbum.media[currentMediaIndex];
    const totalPhotos = albums.reduce((sum, album) => sum + album.media.length, 0);
    const currentPhotoNumber = albums.slice(0, currentAlbumIndex).reduce((sum, album) => sum + album.media.length, 0) + currentMediaIndex + 1;

    // Start Screen
    if (!hasStarted) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-2xl px-8"
                >
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        className="text-9xl mb-8"
                    >
                        📖
                    </motion.div>

                    <h1 className="text-5xl font-bold text-white mb-4">
                        {locationName}
                    </h1>

                    <p className="text-2xl text-white/90 mb-2">
                        Memories Collection
                    </p>

                    <p className="text-lg text-white/70 mb-8">
                        {albums.length} {albums.length === 1 ? 'Album' : 'Albums'} • {totalPhotos} {totalPhotos === 1 ? 'Memory' : 'Memories'}
                        {allMusic.length > 0 && ` • ${allMusic.length} ${allMusic.length === 1 ? 'Song' : 'Songs'}`}
                    </p>

                    <motion.button
                        onClick={startExperience}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-12 py-5 bg-white text-purple-900 rounded-full text-xl font-bold shadow-2xl hover:shadow-white/20 transition-all"
                    >
                        ✨ Start Experience
                    </motion.button>

                    <p className="text-white/50 text-sm mt-8">
                        Tap anywhere to advance • Videos play automatically
                    </p>

                    <button
                        onClick={() => router.push('/map')}
                        className="mt-6 text-white/60 hover:text-white transition-colors text-sm"
                    >
                        ← Back to Map
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black">
            {/* Audio Player */}
            <audio
                ref={audioRef}
                onEnded={handleSongEnd}
                className="hidden"
            />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-6 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-white text-2xl font-bold">{locationName}</h1>
                        <p className="text-white/70 text-sm">Memories Collection</p>
                    </div>
                    <button
                        onClick={() => router.push('/map')}
                        className="text-white hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div
                className="w-full h-full flex items-center justify-center p-20 cursor-pointer"
                onClick={handlePageClick}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentAlbumIndex}-${currentMediaIndex}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                            duration: 0.4,
                            ease: "easeInOut"
                        }}
                        className="relative max-w-5xl max-h-full"
                    >
                        {/* Album Title Overlay */}
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-6 rounded-t-2xl z-10">
                            <h2 className="text-white text-xl font-semibold">{currentAlbum.album.title}</h2>
                            <p className="text-white/80 text-sm">
                                {new Date(currentAlbum.album.eventDate).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Media Display */}
                        {currentMedia.fileType.startsWith('image/') ? (
                            <img
                                src={currentMedia.url}
                                alt={currentMedia.fileName}
                                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
                                onLoad={() => setVideoEnded(true)}
                            />
                        ) : (
                            <video
                                ref={videoRef}
                                src={currentMedia.url}
                                autoPlay
                                onEnded={handleVideoEnd}
                                onLoadedData={() => setVideoEnded(false)}
                                className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}

                        {/* Photo Counter */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-2xl">
                            <p className="text-white text-center text-sm">
                                Photo {currentPhotoNumber} of {totalPhotos} • Album {currentAlbumIndex + 1} of {albums.length}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Album Navigation Buttons */}
            {currentAlbumIndex > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        prevAlbum();
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-4 rounded-full transition-all z-20"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {currentAlbumIndex < albums.length - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        nextAlbum();
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-4 rounded-full transition-all z-20"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Progress Indicator */}
                    <div className="flex justify-center gap-1 mb-4">
                        {currentAlbum.media.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1 rounded-full transition-all ${index === currentMediaIndex
                                    ? 'w-8 bg-white'
                                    : index < currentMediaIndex
                                        ? 'w-1 bg-white/60'
                                        : 'w-1 bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Music Player */}
                    {allMusic.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePlayPause();
                                        }}
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
                                            {currentMusicIndex >= 0 && allMusic[currentMusicIndex]
                                                ? allMusic[currentMusicIndex].fileName.replace(/\.[^/.]+$/, '')
                                                : 'No song selected'}
                                        </p>
                                        <p className="text-white/60 text-xs">
                                            {allMusic.length} {allMusic.length === 1 ? 'song' : 'songs'} in collection
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPlaylist(!showPlaylist);
                                    }}
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
                                        {allMusic.map((song, index) => (
                                            <button
                                                key={song.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectSong(index);
                                                }}
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

                    {/* Navigation Hint */}
                    <p className="text-white/60 text-center text-sm mt-4">
                        Click left to go back • Click right to advance • Auto-advances every 3s
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function MemoriesPageWrapper() {
    return (
        <ProtectedRoute>
            <MemoriesPage />
        </ProtectedRoute>
    );
}
