'use client';

import { motion } from 'framer-motion';
import { storage, db } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { deleteDoc, doc } from 'firebase/firestore';

interface Music {
    id: string;
    fileName: string;
    url: string;
    storagePath: string;
    fileSize: number;
    createdAt: string;
}

interface MusicListProps {
    music: Music[];
    onDelete: () => void;
}

export default function MusicList({ music, onDelete }: MusicListProps) {
    const handleDelete = async (musicItem: Music) => {
        if (!confirm(`Delete "${musicItem.fileName}"?`)) return;

        try {
            // Delete from storage
            const storageRef = ref(storage, musicItem.storagePath);
            await deleteObject(storageRef);

            // Delete from Firestore
            await deleteDoc(doc(db, 'music', musicItem.id));

            onDelete();
        } catch (error) {
            console.error('Error deleting music:', error);
            alert('Failed to delete music. Please try again.');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (music.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎵</div>
                <p className="text-sm">No music uploaded yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {music.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-2 rounded-lg">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {item.fileName.replace(/\.[^/.]+$/, '')}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(item.fileSize)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a
                                href={item.url}
                                download={item.fileName}
                                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                title="Download"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </a>
                            <button
                                onClick={() => handleDelete(item)}
                                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                                title="Delete"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
