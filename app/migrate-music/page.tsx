'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function MigrateMusicPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string>('');

    const migrateMusic = async () => {
        if (!user) {
            setResult('Error: No user logged in');
            return;
        }

        setIsLoading(true);
        setResult('Starting migration...');

        try {
            // Get all music documents
            const musicSnapshot = await getDocs(collection(db, 'music'));
            let updated = 0;
            let skipped = 0;
            let errors = 0;

            for (const musicDoc of musicSnapshot.docs) {
                const data = musicDoc.data();

                // Check if userId already exists
                if (data.userId) {
                    skipped++;
                    continue;
                }

                try {
                    // Add userId to the document
                    await updateDoc(doc(db, 'music', musicDoc.id), {
                        userId: user.uid
                    });
                    updated++;
                    setResult(`Migrated ${updated} music files...`);
                } catch (error) {
                    console.error(`Error updating ${musicDoc.id}:`, error);
                    errors++;
                }
            }

            setResult(
                `Migration complete!\n` +
                `✅ Updated: ${updated} files\n` +
                `⏭️ Skipped: ${skipped} files (already had userId)\n` +
                `❌ Errors: ${errors} files`
            );
        } catch (error) {
            console.error('Migration error:', error);
            setResult(`Error: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">
                            🎵 Music Database Migration
                        </h1>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <p className="text-sm text-yellow-800">
                                <strong>What this does:</strong> Adds your user ID to all existing music files
                                so they appear in the global music library.
                            </p>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 mb-2">
                                <strong>Current User:</strong> {user?.email}
                            </p>
                            <p className="text-gray-700">
                                <strong>User ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{user?.uid}</code>
                            </p>
                        </div>

                        <button
                            onClick={migrateMusic}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Migrating...' : '🚀 Start Migration'}
                        </button>

                        {result && (
                            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">Result:</h3>
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <a
                                href="/map"
                                className="text-purple-600 hover:text-purple-800 transition-colors"
                            >
                                ← Back to Map
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

export default MigrateMusicPage;
