'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MediaUpload from '@/components/MediaUpload';
import MediaGallery from '@/components/MediaGallery';
import MusicUpload from '@/components/MusicUpload';
import MusicList from '@/components/MusicList';
import SlideshowView from '@/components/SlideshowView';

interface Album {
    id: string;
    locationId: string;
    locationName: string;
    title: string;
    description: string;
    eventDate: string;
    createdAt: string;
    customThumbnailUrl?: string;
    customThumbnailPath?: string;
}

interface Media {
    id: string;
    albumId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    storagePath: string;
    createdAt: string;
}

interface Music {
    id: string;
    albumId: string;
    fileName: string;
    fileSize: number;
    url: string;
    storagePath: string;
    createdAt: string;
}

function AlbumDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [album, setAlbum] = useState<Album | null>(null);
    const [media, setMedia] = useState<Media[]>([]);
    const [music, setMusic] = useState<Music[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editEventDate, setEditEventDate] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [showSlideshow, setShowSlideshow] = useState(false);

    const albumId = params.albumId as string;
    const locationId = params.locationId as string;

    useEffect(() => {
        loadAlbum();
        loadMedia();
        loadMusic();
    }, [albumId, user]);

    const loadAlbum = async () => {
        if (!user || !albumId) return;

        setIsLoading(true);
        try {
            const albumDoc = await getDoc(doc(db, 'albums', albumId));
            if (albumDoc.exists()) {
                const albumData = { id: albumDoc.id, ...albumDoc.data() } as Album;
                setAlbum(albumData);
                setEditTitle(albumData.title);
                setEditDescription(albumData.description);
                setEditEventDate(albumData.eventDate);
            } else {
                alert('Album not found');
                router.push(`/location/${locationId}/albums`);
            }
        } catch (error) {
            console.error('Error loading album:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMedia = async () => {
        if (!user || !albumId) return;

        try {
            const q = query(
                collection(db, 'media'),
                where('albumId', '==', albumId)
            );
            const querySnapshot = await getDocs(q);
            const mediaList: Media[] = [];

            querySnapshot.forEach((doc) => {
                mediaList.push({ id: doc.id, ...doc.data() } as Media);
            });

            // Sort by creation date (newest first)
            mediaList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setMedia(mediaList);
        } catch (error) {
            console.error('Error loading media:', error);
        }
    };

    const loadMusic = async () => {
        if (!user) return;

        try {
            // Load ALL music for this user (global music library)
            const q = query(
                collection(db, 'music'),
                where('userId', '==', user.uid)
            );
            const querySnapshot = await getDocs(q);
            const musicList: Music[] = [];

            querySnapshot.forEach((doc) => {
                musicList.push({ id: doc.id, ...doc.data() } as Music);
            });

            setMusic(musicList);
        } catch (error) {
            console.error('Error loading music:', error);
        }
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert('Image must be less than 10MB');
                return;
            }
            setThumbnailFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadThumbnail = async (): Promise<{ url: string; path: string } | null> => {
        if (!thumbnailFile || !album) return null;

        setIsUploadingThumbnail(true);
        try {
            const fileName = `thumbnail_${Date.now()}_${thumbnailFile.name}`;
            const storageRef = ref(storage, `album-thumbnails/${album.id}/${fileName}`);

            const uploadTask = uploadBytesResumable(storageRef, thumbnailFile);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    null,
                    (error) => {
                        console.error('Thumbnail upload error:', error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve({
                            url: downloadURL,
                            path: `album-thumbnails/${album.id}/${fileName}`
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Error uploading thumbnail:', error);
            throw error;
        } finally {
            setIsUploadingThumbnail(false);
        }
    };

    const removeThumbnail = async () => {
        if (!album || !album.customThumbnailPath) return;

        try {
            // Delete from storage
            const storageRef = ref(storage, album.customThumbnailPath);
            await deleteObject(storageRef);

            // Update Firestore
            await updateDoc(doc(db, 'albums', album.id), {
                customThumbnailUrl: null,
                customThumbnailPath: null,
            });

            setThumbnailFile(null);
            setThumbnailPreview('');
            await loadAlbum();
        } catch (error) {
            console.error('Error removing thumbnail:', error);
            alert('Failed to remove thumbnail');
        }
    };

    const saveChanges = async () => {
        if (!album || !editTitle.trim()) {
            alert('Please enter a title');
            return;
        }

        try {
            const updateData: any = {
                title: editTitle.trim(),
                description: editDescription.trim(),
                eventDate: editEventDate,
            };

            // Upload new thumbnail if selected
            if (thumbnailFile) {
                const thumbnailData = await uploadThumbnail();
                if (thumbnailData) {
                    // Delete old thumbnail if exists
                    if (album.customThumbnailPath) {
                        try {
                            const oldRef = ref(storage, album.customThumbnailPath);
                            await deleteObject(oldRef);
                        } catch (error) {
                            console.error('Error deleting old thumbnail:', error);
                        }
                    }

                    updateData.customThumbnailUrl = thumbnailData.url;
                    updateData.customThumbnailPath = thumbnailData.path;
                }
            }

            await updateDoc(doc(db, 'albums', album.id), updateData);

            setThumbnailFile(null);
            setThumbnailPreview('');
            await loadAlbum();
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating album:', error);
            alert('Failed to update album. Please try again.');
        }
    };

    const deleteAlbum = async () => {
        if (!album) return;
        if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) return;

        try {
            await deleteDoc(doc(db, 'albums', album.id));
            router.push(`/location/${locationId}/albums`);
        } catch (error) {
            console.error('Error deleting album:', error);
            alert('Failed to delete album. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading album...</p>
                </div>
            </div>
        );
    }

    if (!album) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto mb-8"
            >
                <button
                    onClick={() => router.push(`/location/${locationId}/albums`)}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Albums
                </button>
            </motion.div>

            {/* Album Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Cover Image with Thumbnail */}
                <div className="relative h-64 bg-gradient-to-br from-rose-400 to-pink-400 overflow-hidden">
                    {(album.customThumbnailUrl || (media.length > 0 && media[0].url)) ? (
                        <>
                            <img
                                src={album.customThumbnailUrl || media[0].url}
                                alt={album.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            {/* Media count badge */}
                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                                📸 {media.length} {media.length === 1 ? 'photo' : 'photos'}
                            </div>
                            {/* Custom thumbnail indicator */}
                            {album.customThumbnailUrl && (
                                <div className="absolute top-4 left-4 bg-purple-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                                    🎨 Custom Cover
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-white text-8xl mb-2">📸</div>
                                <p className="text-white text-lg opacity-90">No photos yet</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Album Details */}
                <div className="p-8">
                    {isEditing ? (
                        /* Edit Mode */
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                    Album Title
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="Enter album title"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Describe this album..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none resize-none text-gray-900 placeholder-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                    Event Date
                                </label>
                                <input
                                    type="date"
                                    value={editEventDate}
                                    onChange={(e) => setEditEventDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none text-gray-900"
                                />
                            </div>

                            {/* Custom Thumbnail Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                    Custom Album Cover
                                </label>
                                <p className="text-xs text-gray-600 mb-3">
                                    Upload a custom thumbnail for this album (different from the photos inside)
                                </p>

                                {/* Current or Preview Thumbnail */}
                                {(thumbnailPreview || album.customThumbnailUrl) && (
                                    <div className="mb-3 relative">
                                        <img
                                            src={thumbnailPreview || album.customThumbnailUrl}
                                            alt="Thumbnail preview"
                                            className="w-full h-48 object-cover rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (thumbnailPreview) {
                                                    setThumbnailFile(null);
                                                    setThumbnailPreview('');
                                                } else if (album.customThumbnailUrl) {
                                                    removeThumbnail();
                                                }
                                            }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Upload Button */}
                                <label className="block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailSelect}
                                        className="hidden"
                                    />
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all">
                                        <div className="text-4xl mb-2">🖼️</div>
                                        <p className="text-sm text-gray-600">
                                            {thumbnailFile || album.customThumbnailUrl
                                                ? 'Click to change thumbnail'
                                                : 'Click to upload thumbnail'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Max 10MB • JPG, PNG, GIF
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setEditTitle(album.title);
                                        setEditDescription(album.description);
                                        setEditEventDate(album.eventDate);
                                        setIsEditing(false);
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveChanges}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all font-medium"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <>
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    {album.title}
                                </h1>
                                <p className="text-gray-600 mb-2">
                                    📍 {album.locationName}
                                </p>
                                <p className="text-gray-600">
                                    📅 {new Date(album.eventDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>

                            {album.description && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                    <p className="text-gray-700 whitespace-pre-line">
                                        {album.description}
                                    </p>
                                </div>
                            )}

                            {/* Media Upload */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">
                                    📸 Photos & Videos
                                </h2>
                                <MediaUpload
                                    albumId={albumId}
                                    onUploadComplete={loadMedia}
                                />
                            </div>

                            {/* Media Gallery */}
                            {media.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Gallery ({media.length} {media.length === 1 ? 'item' : 'items'})
                                        </h3>
                                        <button
                                            onClick={() => setShowSlideshow(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-md flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Start Slideshow
                                        </button>
                                    </div>
                                    <MediaGallery
                                        media={media}
                                        onMediaDeleted={loadMedia}
                                    />
                                </div>
                            )}

                            {/* Music Upload */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">
                                    🎵 Background Music
                                </h2>
                                <MusicUpload
                                    albumId={albumId}
                                    onUploadComplete={loadMusic}
                                />
                            </div>

                            {/* Music List */}
                            {music.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                        Playlist ({music.length} {music.length === 1 ? 'song' : 'songs'})
                                    </h3>
                                    <MusicList
                                        music={music}
                                        onDelete={loadMusic}
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                                >
                                    ✏️ Edit Album
                                </button>
                                <button
                                    onClick={deleteAlbum}
                                    className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Slideshow View */}
            {showSlideshow && album && (
                <SlideshowView
                    albumTitle={album.title}
                    media={media}
                    music={music}
                    onClose={() => setShowSlideshow(false)}
                />
            )}
        </div>
    );
}

export default function AlbumDetailPageWrapper() {
    return (
        <ProtectedRoute>
            <AlbumDetailPage />
        </ProtectedRoute>
    );
}
