'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

interface MediaUploadProps {
    albumId: string;
    onUploadComplete: () => void;
}

interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'complete' | 'error';
}

export default function MediaUpload({ albumId, onUploadComplete }: MediaUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
        }
    };

    const handleFiles = async (files: File[]) => {
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB max

            if (!isImage && !isVideo) {
                alert(`${file.name} is not a valid image or video file`);
                return false;
            }
            if (!isValidSize) {
                alert(`${file.name} is too large. Max size is 100MB`);
                return false;
            }
            return true;
        });

        for (const file of validFiles) {
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `albums/${albumId}/${fileName}`);

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

                // Save to Firestore
                try {
                    await addDoc(collection(db, 'media'), {
                        albumId,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        url: downloadURL,
                        storagePath: `albums/${albumId}/${fileName}`,
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
                    console.error('Error saving media to Firestore:', error);
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
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-300 hover:border-rose-400 hover:bg-gray-50'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="text-4xl mb-3">
                    {isDragging ? '📥' : '📸'}
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {isDragging ? 'Drop files here' : 'Upload Photos & Videos'}
                </h3>

                <p className="text-sm text-gray-700 mb-2">
                    Drag and drop or click to browse
                </p>

                <p className="text-xs text-gray-600">
                    Supports: JPG, PNG, GIF, MP4, MOV (Max 100MB)
                </p>
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
                                className="bg-white rounded-xl p-4 shadow-md"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 truncate flex-1">
                                        {upload.fileName}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                        {upload.status === 'complete' ? '✅' :
                                            upload.status === 'error' ? '❌' :
                                                `${Math.round(upload.progress)}%`}
                                    </span>
                                </div>

                                {upload.status === 'uploading' && (
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${upload.progress}%` }}
                                            className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full"
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
