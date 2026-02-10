'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function SettingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { workspace } = useWorkspace();

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

                    {/* Migration Tools */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
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
