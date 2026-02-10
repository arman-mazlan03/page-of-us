'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Album {
    id: string;
    locationId: string;
    locationName: string;
    title: string;
    description: string;
    eventDate: string;
    createdAt: string;
    customThumbnailUrl?: string;
}

interface AlbumWithThumbnail extends Album {
    thumbnailUrl?: string;
    mediaCount?: number;
}

function AlbumsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [albums, setAlbums] = useState<AlbumWithThumbnail[]>([]);
    const [locationName, setLocationName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const locationId = params.locationId as string;

    useEffect(() => {
        loadAlbums();
    }, [locationId, user]);

    const loadAlbums = async () => {
        if (!user || !locationId) return;

        setIsLoading(true);
        try {
            const q = query(
                collection(db, 'albums'),
                where('locationId', '==', locationId)
            );
            const querySnapshot = await getDocs(q);
            const albumsList: Album[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                albumsList.push({ id: doc.id, ...data } as Album);
                if (!locationName && data.locationName) {
                    setLocationName(data.locationName);
                }
            });

            // Sort by event date (newest first)
            albumsList.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

            // Load thumbnails for each album
            const albumsWithThumbnails = await Promise.all(
                albumsList.map(async (album) => {
                    const thumbnail = await loadAlbumThumbnail(album.id);
                    return { ...album, ...thumbnail };
                })
            );

            setAlbums(albumsWithThumbnails);
        } catch (error) {
            console.error('Error loading albums:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAlbumThumbnail = async (albumId: string) => {
        try {
            // Get first media item for this album
            const q = query(
                collection(db, 'media'),
                where('albumId', '==', albumId),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            // Get total media count
            const countQuery = query(
                collection(db, 'media'),
                where('albumId', '==', albumId)
            );
            const countSnapshot = await getDocs(countQuery);
            const mediaCount = countSnapshot.size;

            if (!querySnapshot.empty) {
                const firstMedia = querySnapshot.docs[0].data();
                return {
                    thumbnailUrl: firstMedia.url,
                    mediaCount
                };
            }

            return { mediaCount };
        } catch (error) {
            console.error('Error loading thumbnail:', error);
            return {};
        }
    };

    const deleteAlbum = async (albumId: string) => {
        if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) return;

        try {
            await deleteDoc(doc(db, 'albums', albumId));
            await loadAlbums();
        } catch (error) {
            console.error('Error deleting album:', error);
            alert('Failed to delete album. Please try again.');
        }
    };

    const viewAlbum = (albumId: string) => {
        router.push(`/location/${locationId}/albums/${albumId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto mb-8"
            >
                <button
                    onClick={() => router.push('/map')}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Map
                </button>

                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    📸 Albums
                </h1>
                <p className="text-lg text-gray-600">
                    📍 {locationName || 'Loading...'}
                </p>
            </motion.div>

            {/* Albums Grid */}
            <div className="max-w-4xl mx-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading albums...</p>
                        </div>
                    </div>
                ) : albums.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-lg p-12 text-center"
                    >
                        <div className="text-6xl mb-4">📷</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Albums Yet</h2>
                        <p className="text-gray-600 mb-6">
                            Create your first album to start capturing memories at this location!
                        </p>
                        <button
                            onClick={() => router.push('/map')}
                            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all font-medium"
                        >
                            Go Back to Map
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {albums.map((album, index) => (
                            <motion.div
                                key={album.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                                onClick={() => viewAlbum(album.id)}
                            >
                                {/* Album Cover with Thumbnail */}
                                <div className="relative h-48 bg-gradient-to-br from-rose-400 to-pink-400 overflow-hidden">
                                    {(album.customThumbnailUrl || album.thumbnailUrl) ? (
                                        <>
                                            <img
                                                src={album.customThumbnailUrl || album.thumbnailUrl}
                                                alt={album.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Overlay with media count */}
                                            {album.mediaCount && album.mediaCount > 0 && (
                                                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                    📸 {album.mediaCount}
                                                </div>
                                            )}
                                            {/* Custom thumbnail indicator */}
                                            {album.customThumbnailUrl && (
                                                <div className="absolute top-2 left-2 bg-purple-500/90 text-white px-2 py-1 rounded-full text-xs font-medium">
                                                    🎨
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-white text-6xl mb-2">📸</div>
                                                {album.mediaCount === 0 && (
                                                    <p className="text-white text-sm opacity-80">No photos yet</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Album Info */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        {album.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        📅 {new Date(album.eventDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    {album.description && (
                                        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                                            {album.description}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                viewAlbum(album.id);
                                            }}
                                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteAlbum(album.id);
                                            }}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AlbumsPageWrapper() {
    return (
        <ProtectedRoute>
            <AlbumsPage />
        </ProtectedRoute>
    );
}
