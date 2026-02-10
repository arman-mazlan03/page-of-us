'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (albumData: AlbumData) => Promise<void>;
    locationName: string;
}

export interface AlbumData {
    title: string;
    description: string;
    eventDate: string;
}

export default function AlbumModal({ isOpen, onClose, onSave, locationName }: AlbumModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Please enter a title for the album');
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                title: title.trim(),
                description: description.trim(),
                eventDate: eventDate || new Date().toISOString().split('T')[0],
            });

            // Reset form
            setTitle('');
            setDescription('');
            setEventDate('');
            onClose();
        } catch (error) {
            console.error('Error saving album:', error);
            alert('Failed to create album. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setTitle('');
            setDescription('');
            setEventDate('');
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Create Album</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        📍 {locationName}
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                        Album Title *
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Our First Date, Birthday 2024"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none"
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tell the story of this moment..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none resize-none"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Event Date */}
                                <div>
                                    <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                                        Event Date
                                    </label>
                                    <input
                                        id="eventDate"
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Album'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
