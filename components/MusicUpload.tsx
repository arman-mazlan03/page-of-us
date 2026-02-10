'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface MusicUploadProps {
    albumId: string;
    onUploadComplete: () => void;
}

interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'complete' | 'error';
}

export default function MusicUpload({ albumId, onUploadComplete }: MusicUploadProps) {
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
        }
    };

    const handleFiles = async (files: File[]) => {
        const validFiles = files.filter(file => {
            const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.mp3');
            const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB max

            if (!isAudio) {
                alert(`${file.name} is not a valid audio file`);
                return false;
            }
            if (!isValidSize) {
                alert(`${file.name} is too large. Max size is 50MB`);
                return false;
            }
            return true;
        });

        for (const file of validFiles) {
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        if (!user) return;

        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `album-music/${albumId}/${fileName}`);

        // Add to uploads list
        setUploads(prev => [...prev, {
            fileName: file.name,
            progress: 0,
            status: 'uploading'
        }]);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploads(prev => prev.map(upload =>
                    upload.fileName === file.name
                        ? { ...upload, progress }
                        : upload
                ));
            },
            (error) => {
                console.error('Upload error:', error);
                setUploads(prev => prev.map(upload =>
                    upload.fileName === file.name
                        ? { ...upload, status: 'error' }
                        : upload
                ));
            },
            async () => {
                // Upload complete
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // Save to Firestore with userId for global access
                try {
                    await addDoc(collection(db, 'music'), {
                        userId: user.uid,
                        albumId,
                        fileName: file.name,
                        fileSize: file.size,
                        url: downloadURL,
                        storagePath: `album-music/${albumId}/${fileName}`,
                        createdAt: new Date().toISOString(),
                    });

                    setUploads(prev => prev.map(upload =>
                        upload.fileName === file.name
                            ? { ...upload, progress: 100, status: 'complete' }
                            : upload
                    ));

                    // Remove from list after 2 seconds
                    setTimeout(() => {
                        setUploads(prev => prev.filter(upload => upload.fileName !== file.name));
                        onUploadComplete();
                    }, 2000);
                } catch (error) {
                    console.error('Error saving music to Firestore:', error);
                    setUploads(prev => prev.map(upload =>
                        upload.fileName === file.name
                            ? { ...upload, status: 'error' }
                            : upload
                    ));
                }
            }
        );
    };

    return (
        <div className="space-y-3">
            {/* Upload Button */}
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="audio/*,.mp3"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-center cursor-pointer"
                >
                    <div className="text-3xl mb-1">🎵</div>
                    <p className="text-sm font-medium text-gray-800">Upload Music</p>
                    <p className="text-xs text-gray-600 mt-1">MP3, WAV (Max 50MB)</p>
                </button>
            </div>

            {/* Upload Progress */}
            <AnimatePresence>
                {uploads.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        {uploads.map((upload, index) => (
                            <motion.div
                                key={upload.fileName}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-lg p-3 shadow-sm border border-gray-200"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-700 truncate flex-1">
                                        {upload.fileName}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                        {upload.status === 'complete' ? '✅' :
                                            upload.status === 'error' ? '❌' :
                                                `${Math.round(upload.progress)}%`}
                                    </span>
                                </div>

                                {upload.status === 'uploading' && (
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${upload.progress}%` }}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                                        />
                                    </div>
                                )}

                                {upload.status === 'complete' && (
                                    <p className="text-xs text-green-600">Upload complete!</p>
                                )}

                                {upload.status === 'error' && (
                                    <p className="text-xs text-red-600">Upload failed. Please try again.</p>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
