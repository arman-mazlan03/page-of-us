'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage, db } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { deleteDoc, doc } from 'firebase/firestore';

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

interface MediaGalleryProps {
    media: Media[];
    onMediaDeleted: () => void;
}

export default function MediaGallery({ media, onMediaDeleted }: MediaGalleryProps) {
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openLightbox = (mediaItem: Media, index: number) => {
        setSelectedMedia(mediaItem);
        setCurrentIndex(index);
    };

    const closeLightbox = () => {
        setSelectedMedia(null);
    };

    const goToNext = () => {
        if (currentIndex < media.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setSelectedMedia(media[nextIndex]);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            setSelectedMedia(media[prevIndex]);
        }
    };

    const deleteMedia = async (mediaItem: Media) => {
        if (!confirm('Are you sure you want to delete this media?')) return;

        try {
            // Delete from Storage
            const storageRef = ref(storage, mediaItem.storagePath);
            await deleteObject(storageRef);

            // Delete from Firestore
            await deleteDoc(doc(db, 'media', mediaItem.id));

            closeLightbox();
            onMediaDeleted();
        } catch (error) {
            console.error('Error deleting media:', error);
            alert('Failed to delete media. Please try again.');
        }
    };

    const isVideo = (fileType: string) => fileType.startsWith('video/');

    if (media.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📷</div>
                <p>No media uploaded yet</p>
            </div>
        );
    }

    return (
        <>
            {/* Media Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => openLightbox(item, index)}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-gray-100"
                    >
                        {isVideo(item.fileType) ? (
                            <>
                                <video
                                    src={item.url}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <img
                                src={item.url}
                                alt={item.fileName}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        )}

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white text-xs truncate">{item.fileName}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedMedia && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Navigation Buttons */}
                        {currentIndex > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToPrevious();
                                }}
                                className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
                            >
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        {currentIndex < media.length - 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToNext();
                                }}
                                className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
                            >
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}

                        {/* Media Content */}
                        <motion.div
                            key={selectedMedia.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-5xl max-h-[90vh] w-full"
                        >
                            {isVideo(selectedMedia.fileType) ? (
                                <video
                                    src={selectedMedia.url}
                                    controls
                                    autoPlay
                                    className="w-full h-full max-h-[80vh] rounded-lg"
                                />
                            ) : (
                                <img
                                    src={selectedMedia.url}
                                    alt={selectedMedia.fileName}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            )}

                            {/* Media Info & Actions */}
                            <div className="mt-4 flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <div className="text-white">
                                    <p className="font-medium">{selectedMedia.fileName}</p>
                                    <p className="text-sm text-gray-300">
                                        {new Date(selectedMedia.createdAt).toLocaleDateString()} • {(selectedMedia.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={selectedMedia.url}
                                        download={selectedMedia.fileName}
                                        onClick={(e) => e.stopPropagation()}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                    >
                                        ⬇️ Download
                                    </a>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteMedia(selectedMedia);
                                        }}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Counter */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                            {currentIndex + 1} / {media.length}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
