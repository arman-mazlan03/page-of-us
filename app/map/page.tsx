'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import MapComponent from '@/components/GoogleMapComponent';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function MapPage() {
    const { user, signOut, sessionExpiry } = useAuth();
    const router = useRouter();
    const [timeRemaining, setTimeRemaining] = useState('');

    const handleSignOut = async () => {
        await signOut();
    };

    useEffect(() => {
        const updateTimer = () => {
            if (!sessionExpiry) {
                setTimeRemaining('');
                return;
            }
            const remaining = sessionExpiry - Date.now();
            if (remaining <= 0) {
                setTimeRemaining('Expired');
                return;
            }
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            setTimeRemaining(`${hours}h ${minutes}m`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [sessionExpiry]);

    return (
        <ProtectedRoute>
            <div className="h-screen flex flex-col">
                {/* Header - Mobile Responsive */}
                <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm z-20">
                    <div className="px-3 md:px-6 py-3 flex justify-between items-center">
                        {/* Left: Logo & User */}
                        <div className="flex items-center space-x-2 md:space-x-3">
                            <span className="text-2xl md:text-3xl">📖</span>
                            <div>
                                <h1 className="text-sm md:text-xl font-bold text-gray-800">Page of Us</h1>
                                <p className="text-xs text-gray-600 hidden md:block">{user?.email}</p>
                            </div>
                        </div>


                        {/* Right: View Memories, Settings & Sign Out */}
                        <div className="flex items-center space-x-2 md:space-x-4">
                            {/* View All Memories Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/memories')}
                                className="px-3 md:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs md:text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
                            >
                                📖 All Memories
                            </motion.button>

                            {/* Settings Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/settings')}
                                className="px-3 md:px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-300 transition-all"
                                title="Workspace Settings"
                            >
                                ⚙️
                            </motion.button>

                            {/* Sign Out Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSignOut}
                                className="px-3 md:px-4 py-2 bg-gray-800 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-gray-700 transition-colors"
                            >
                                Sign Out
                            </motion.button>
                        </div>
                    </div>
                </header>

                {/* Map Container - Takes remaining height */}
                <main className="flex-1 relative">
                    <MapComponent />
                </main>
            </div>
        </ProtectedRoute>
    );
}
