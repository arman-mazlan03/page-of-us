'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function SettingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { workspace } = useWorkspace();
    const [loginHistory, setLoginHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        async function fetchLoginHistory() {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    // Sort by timestamp descending and take last 5
                    const history = (data.loginHistory || [])
                        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 5);
                    setLoginHistory(history);
                }
            } catch (error) {
                console.error('Error fetching login history:', error);
            } finally {
                setLoadingHistory(false);
            }
        }

        fetchLoginHistory();
    }, [user]);

    const formatToMalaysiaTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100">
                {/* Header */}
                <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl">⚙️</span>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Workspace Settings</h1>
                                <p className="text-sm text-gray-600">{user?.email}</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/map')}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                        >
                            ← Back to Map
                        </motion.button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-4xl mx-auto p-6 space-y-6">
                    {/* Workspace Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Workspace Information</h2>

                        <div className="space-y-4">
                            {/* Workspace Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Workspace Name
                                </label>
                                <p className="text-lg font-semibold text-gray-800">{workspace?.name || 'Our Memories'}</p>
                            </div>

                            {/* Member Count */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Authorized Users
                                </label>
                                <p className="text-lg text-gray-800">
                                    {workspace?.allowedEmails.length || 0} {workspace?.allowedEmails.length === 1 ? 'user' : 'users'}
                                </p>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Shared Workspace:</strong> All authorized users share the same locations, albums, photos, and music. Everyone can view and manage all content.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Authorized Users */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Authorized Users</h2>

                        <div className="space-y-3">
                            {workspace?.allowedEmails.map((email) => (
                                <div
                                    key={email}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{email}</p>
                                            {email === user?.email && (
                                                <p className="text-xs text-gray-500">You</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        Authorized
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>📝 To add or remove users:</strong> Edit the <code className="bg-yellow-100 px-2 py-1 rounded">NEXT_PUBLIC_ALLOWED_EMAILS</code> variable in your <code className="bg-yellow-100 px-2 py-1 rounded">.env.local</code> file, then restart the server.
                            </p>
                        </div>
                    </motion.div>

                    {/* Login Activity - New Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Login Activity</h2>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Malaysia Time (UTC+8)</span>
                        </div>

                        {loadingHistory ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                            </div>
                        ) : loginHistory.length > 0 ? (
                            <div className="space-y-3">
                                {loginHistory.map((login, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-rose-400"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="text-xl">🔑</div>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {formatToMalaysiaTime(login.timestamp)}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-md">
                                                    {login.userAgent || 'Unknown Device'}
                                                </p>
                                            </div>
                                        </div>
                                        {index === 0 && (
                                            <div className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                                Current
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4 italic">No login records found.</p>
                        )}
                    </motion.div>

                    {/* Migration Tools */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Migration</h2>

                        <p className="text-gray-700 mb-4">
                            If you have existing data, run the migration to add workspace IDs to all your content.
                        </p>

                        <button
                            onClick={() => router.push('/migrate-workspace')}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                            🔄 Run Workspace Migration
                        </button>
                    </motion.div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

export default SettingsPage;
