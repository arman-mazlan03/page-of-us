'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function MigrateDataPage() {
    const { user } = useAuth();
    const { workspace } = useWorkspace();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string>('');

    const migrateData = async () => {
        if (!user || !workspace) {
            setResult('Error: No user or workspace found');
            return;
        }

        setIsLoading(true);
        setResult('Starting migration...\n');

        try {
            let totalUpdated = 0;

            // Migrate locations
            const locationsQuery = query(
                collection(db, 'locations'),
                where('userId', '==', user.uid)
            );
            const locationsSnapshot = await getDocs(locationsQuery);
            for (const locationDoc of locationsSnapshot.docs) {
                const data = locationDoc.data();
                if (!data.workspaceId) {
                    await updateDoc(doc(db, 'locations', locationDoc.id), {
                        workspaceId: workspace.id
                    });
                    totalUpdated++;
                }
            }
            setResult(prev => prev + `✅ Migrated ${locationsSnapshot.size} locations\n`);

            // Migrate albums
            const albumsQuery = query(
                collection(db, 'albums'),
                where('userId', '==', user.uid)
            );
            const albumsSnapshot = await getDocs(albumsQuery);
            for (const albumDoc of albumsSnapshot.docs) {
                const data = albumDoc.data();
                if (!data.workspaceId) {
                    await updateDoc(doc(db, 'albums', albumDoc.id), {
                        workspaceId: workspace.id
                    });
                    totalUpdated++;
                }
            }
            setResult(prev => prev + `✅ Migrated ${albumsSnapshot.size} albums\n`);

            // Migrate media
            const mediaQuery = query(
                collection(db, 'media'),
                where('userId', '==', user.uid)
            );
            const mediaSnapshot = await getDocs(mediaQuery);
            for (const mediaDoc of mediaSnapshot.docs) {
                const data = mediaDoc.data();
                if (!data.workspaceId) {
                    await updateDoc(doc(db, 'media', mediaDoc.id), {
                        workspaceId: workspace.id
                    });
                    totalUpdated++;
                }
            }
            setResult(prev => prev + `✅ Migrated ${mediaSnapshot.size} media files\n`);

            // Migrate music
            const musicQuery = query(
                collection(db, 'music'),
                where('userId', '==', user.uid)
            );
            const musicSnapshot = await getDocs(musicQuery);
            for (const musicDoc of musicSnapshot.docs) {
                const data = musicDoc.data();
                if (!data.workspaceId) {
                    await updateDoc(doc(db, 'music', musicDoc.id), {
                        workspaceId: workspace.id
                    });
                    totalUpdated++;
                }
            }
            setResult(prev => prev + `✅ Migrated ${musicSnapshot.size} music files\n`);

            setResult(prev => prev + `\n🎉 Migration complete! Total items updated: ${totalUpdated}`);
        } catch (error) {
            console.error('Migration error:', error);
            setResult(prev => prev + `\n❌ Error: ${error}`);
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
                            🔄 Data Migration to Workspace
                        </h1>

                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                <strong>What this does:</strong> Adds your workspace ID to all existing data
                                (locations, albums, photos, music) so they can be shared with workspace members.
                            </p>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 mb-2">
                                <strong>Current User:</strong> {user?.email}
                            </p>
                            <p className="text-gray-700 mb-2">
                                <strong>Workspace:</strong> {workspace?.name}
                            </p>
                            <p className="text-gray-700">
                                <strong>Workspace ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{workspace?.id}</code>
                            </p>
                        </div>

                        <button
                            onClick={migrateData}
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

export default MigrateDataPage;
