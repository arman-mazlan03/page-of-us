'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { APIProvider, Map, AdvancedMarker, Pin, useMapsLibrary } from '@vis.gl/react-google-maps';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import AlbumModal, { AlbumData } from './AlbumModal';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';

declare global {
    interface Window {
        google: typeof google;
    }
}

const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ['places'];

interface Location {
    id: string;
    latitude: number;
    longitude: number;
    locationName: string;
    createdAt: string;
}

interface Album {
    id: string;
    locationId: string;
    title: string;
    eventDate: string;
    customThumbnailUrl?: string;
    thumbnailUrl?: string;
}

export default function GoogleMapComponent() {
    const router = useRouter();
    const { user } = useAuth();
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [center, setCenter] = useState({ lat: 5.3547, lng: 100.3293 }); // Penang
    const [zoom, setZoom] = useState(12);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAlbumModal, setShowAlbumModal] = useState(false);
    const [albumCount, setAlbumCount] = useState<{ [key: string]: number }>({});
    const [locationAlbums, setLocationAlbums] = useState<{ [key: string]: Album[] }>({});
    const { workspace, moveBottle, replyToBottle, deleteBottleReply } = useWorkspace();
    const [showBottleMessage, setShowBottleMessage] = useState(false);
    const [isMovingBottle, setIsMovingBottle] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);


    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    useEffect(() => {
        loadLocations();
    }, [user]);

    // Initialize Places Autocomplete
    useEffect(() => {
        if (!showSearch || !searchInputRef.current) return;

        // Wait for Google Maps to load
        const initAutocomplete = () => {
            if (typeof google === 'undefined' || !google.maps?.places) {
                setTimeout(initAutocomplete, 100);
                return;
            }

            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current!, {
                fields: ['geometry', 'name', 'formatted_address'],
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry?.location) {
                    const newCenter = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                    };
                    setCenter(newCenter);
                    setZoom(15);
                    setShowSearch(false);
                    setSearchQuery('');
                }
            });
        };

        initAutocomplete();
    }, [showSearch]);

    const loadLocations = async () => {
        if (!user) return;
        try {
            const querySnapshot = await getDocs(collection(db, 'locations'));
            const locs: Location[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
                    locs.push({ id: doc.id, ...data } as Location);
                }
            });
            setLocations(locs);
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    };

    const addLocation = async (lat: number, lng: number) => {
        if (!user) return;
        const locationName = prompt('Enter a name for this location:');
        if (!locationName) return;

        try {
            await addDoc(collection(db, 'locations'), {
                latitude: Number(lat),
                longitude: Number(lng),
                locationName,
                createdAt: new Date().toISOString(),
            });
            await loadLocations();
        } catch (error) {
            console.error('Error adding location:', error);
            alert('Failed to add location. Please try again.');
        }
    };

    const deleteLocation = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location? This will also delete all albums, photos, and music associated with it.')) return;

        try {
            // Step 1: Get all albums for this location
            const albumsQuery = query(
                collection(db, 'albums'),
                where('locationId', '==', id)
            );
            const albumsSnapshot = await getDocs(albumsQuery);

            // Step 2: For each album, delete all media and music
            for (const albumDoc of albumsSnapshot.docs) {
                const albumId = albumDoc.id;

                // Delete all media for this album
                const mediaQuery = query(
                    collection(db, 'media'),
                    where('albumId', '==', albumId)
                );
                const mediaSnapshot = await getDocs(mediaQuery);
                const mediaDeletePromises = mediaSnapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(mediaDeletePromises);

                // Delete all music for this album
                const musicQuery = query(
                    collection(db, 'music'),
                    where('albumId', '==', albumId)
                );
                const musicSnapshot = await getDocs(musicQuery);
                const musicDeletePromises = musicSnapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(musicDeletePromises);

                // Delete the album itself
                await deleteDoc(albumDoc.ref);
            }

            // Step 3: Delete the location
            await deleteDoc(doc(db, 'locations', id));

            // Step 4: Reload and close
            await loadLocations();
            setSelectedLocation(null);

            alert('Location and all associated data deleted successfully!');
        } catch (error) {
            console.error('Error deleting location:', error);
            alert('Failed to delete location. Please try again.');
        }
    };

    const loadAlbumsForLocation = async (locationId: string) => {
        try {
            // Get albums for this location
            const albumsQuery = query(
                collection(db, 'albums'),
                where('locationId', '==', locationId),
                orderBy('eventDate', 'desc'),
                limit(3) // Only load first 3 albums for preview
            );
            const albumsSnapshot = await getDocs(albumsQuery);
            const albums: Album[] = [];

            for (const albumDoc of albumsSnapshot.docs) {
                const albumData = { id: albumDoc.id, ...albumDoc.data() } as Album;

                // If no custom thumbnail, try to get first media item
                if (!albumData.customThumbnailUrl) {
                    const mediaQuery = query(
                        collection(db, 'media'),
                        where('albumId', '==', albumData.id),
                        orderBy('createdAt', 'desc'),
                        limit(1)
                    );
                    const mediaSnapshot = await getDocs(mediaQuery);
                    if (!mediaSnapshot.empty) {
                        albumData.thumbnailUrl = mediaSnapshot.docs[0].data().url;
                    }
                }

                albums.push(albumData);
            }

            setLocationAlbums(prev => ({ ...prev, [locationId]: albums }));
        } catch (error) {
            console.error('Error loading albums:', error);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newCenter = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setCenter(newCenter);
                    setZoom(15);
                },
                (error) => {
                    // Silently handle geolocation errors - user may have denied permission
                    console.warn('Geolocation not available:', error.message || 'Permission denied');
                    // Don't show alert - just use default map location
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    const createAlbum = async (albumData: AlbumData) => {
        if (!user || !selectedLocation) return;

        try {
            await addDoc(collection(db, 'albums'), {
                locationId: selectedLocation.id,
                locationName: selectedLocation.locationName,
                title: albumData.title,
                description: albumData.description,
                eventDate: albumData.eventDate,
                createdAt: new Date().toISOString(),
                userId: user.uid,
            });

            // Reload album counts
            await loadAlbumCounts();
        } catch (error) {
            console.error('Error creating album:', error);
            throw error;
        }
    };

    const loadAlbumCounts = async () => {
        if (!user) return;
        try {
            const albumsSnapshot = await getDocs(collection(db, 'albums'));
            const counts: { [key: string]: number } = {};

            albumsSnapshot.forEach((doc) => {
                const data = doc.data();
                const locationId = data.locationId;
                counts[locationId] = (counts[locationId] || 0) + 1;
            });

            setAlbumCount(counts);
        } catch (error) {
            console.error('Error loading album counts:', error);
        }
    };

    const viewAlbums = (locationId: string) => {
        router.push(`/location/${locationId}/albums`);
    };

    // Load album counts when locations change
    useEffect(() => {
        if (locations.length > 0) {
            loadAlbumCounts();
        }
    }, [locations]);

    useEffect(() => {
        if (workspace?.bottle) {
            console.log('GoogleMapComponent: workspace.bottle data', workspace.bottle);
        }
    }, [workspace?.bottle]);

    const handleOpenBottle = () => {
        setShowBottleMessage(true);
    };

    const handleReadMessage = async () => {
        setIsMovingBottle(true);

        // Ensure coordinates are numbers before math
        const currentLat = Number(workspace?.bottle?.lat || center.lat);
        const currentLng = Number(workspace?.bottle?.lng || center.lng);

        // Random offset between -0.05 and 0.05 degrees (~5km)
        const randomLat = (Math.random() - 0.5) * 0.1;
        const randomLng = (Math.random() - 0.5) * 0.1;

        const newLat = currentLat + randomLat;
        const newLng = currentLng + randomLng;

        console.log('Relocating bottle from', currentLat, currentLng, 'to', newLat, newLng);

        await moveBottle(newLat, newLng);
        setShowBottleMessage(false);
        setIsMovingBottle(false);

        alert("The bottle has drifted away to a new secret location! 🌊🍾");
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setIsSubmittingReply(true);
        await replyToBottle(replyText.trim());
        setReplyText('');
        setIsSubmittingReply(false);
    };

    const jumpToBottle = () => {
        if (workspace?.bottle) {
            const lat = Number(workspace.bottle.lat);
            const lng = Number(workspace.bottle.lng);
            console.log('Jumping to bottle:', lat, lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                setCenter({ lat, lng });
                setZoom(15);
            }
        }
    };

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
                    <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Google Maps API Key Missing</h2>
                    <p className="text-sm text-gray-700 mb-4">
                        Please add your Google Maps API key to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>
                    </p>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                        <li>Go to <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" className="text-blue-600 underline">Google Cloud Console</a></li>
                        <li>Create a new project or select existing</li>
                        <li>Enable "Maps JavaScript API"</li>
                        <li>Create credentials (API Key)</li>
                        <li>Add to .env.local as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</li>
                    </ol>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <APIProvider apiKey={apiKey} libraries={GOOGLE_MAPS_LIBRARIES}>
                <Map
                    center={center}
                    zoom={zoom}
                    mapId="page-of-us-map"
                    onClick={(e) => {
                        if (e.detail.latLng && typeof e.detail.latLng.lat === 'number') {
                            addLocation(e.detail.latLng.lat, e.detail.latLng.lng);
                        }
                    }}
                    onCameraChanged={(ev) => {
                        setCenter({
                            lat: Number(ev.detail.center.lat),
                            lng: Number(ev.detail.center.lng)
                        });
                        setZoom(Number(ev.detail.zoom));
                    }}
                    className="w-full h-full"
                >
                    {locations.map((location) => (
                        <AdvancedMarker
                            key={location.id}
                            position={{ lat: location.latitude, lng: location.longitude }}
                            onClick={() => {
                                setSelectedLocation(location);
                                loadAlbumsForLocation(location.id);
                            }}
                        >
                            <Pin background={'#ef4444'} borderColor={'#991b1b'} glyphColor={'#fff'} />
                        </AdvancedMarker>
                    ))}

                    {/* Secret Bottle Marker */}
                    {workspace?.bottle && !isNaN(Number(workspace.bottle.lat)) && !isNaN(Number(workspace.bottle.lng)) && (
                        <AdvancedMarker
                            position={{
                                lat: Number(workspace.bottle.lat),
                                lng: Number(workspace.bottle.lng)
                            }}
                            onClick={handleOpenBottle}
                        >
                            <div className="text-2xl animate-bounce cursor-pointer hover:scale-125 transition-transform" title="A mysterious bottle...">
                                🍾
                            </div>
                        </AdvancedMarker>
                    )}
                </Map>
            </APIProvider>

            {/* Find Bottle Button */}
            {workspace?.bottle && (
                <button
                    onClick={jumpToBottle}
                    className="absolute top-56 left-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10 text-xl"
                    title="Find the mystery bottle"
                >
                    🔍🍾
                </button>
            )}

            {/* Bottle Message Modal - Paper Theme */}
            <AnimatePresence>
                {showBottleMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: 50, opacity: 0, rotate: -2 }}
                            animate={{ y: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: 50, opacity: 0, scale: 0.9 }}
                            className="relative max-w-md w-full bg-[#fdf6e3] p-8 shadow-[0_10px_50px_rgba(0,0,0,0.3)] border-8 border-double border-[#d3af37] rounded-sm max-h-[90vh] overflow-y-auto"
                            style={{ backgroundImage: 'radial-gradient(#f3e5ab 1px, transparent 0)', backgroundSize: '20px 20px' }}
                        >
                            {/* Paper texture and elements */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#d3af37]/10 rounded-bl-full"></div>

                            <div className="text-center space-y-4">
                                <div className="text-3xl mb-2">📜</div>
                                <div className="flex justify-between items-center border-b-2 border-[#5c4033]/20 pb-2">
                                    <h4 className="font-serif text-xl font-bold text-[#5c4033]">
                                        A message for you...
                                    </h4>
                                    <button
                                        onClick={() => setShowBottleMessage(false)}
                                        className="text-[#5c4033]/40 hover:text-[#5c4033] transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="py-4">
                                    <p className="font-serif text-lg italic text-[#5c4033] leading-relaxed drop-shadow-sm">
                                        "{workspace?.bottle?.message}"
                                    </p>
                                </div>

                                {/* Replies Section */}
                                {(workspace?.bottle?.replies?.length || 0) > 0 && (
                                    <div className="space-y-3 mt-4 text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c4033]/40 border-t border-[#5c4033]/10 pt-4">
                                            Replies
                                        </p>
                                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {workspace?.bottle?.replies?.map((reply) => (
                                                <div key={reply.id} className="relative group bg-[#5c4033]/5 p-3 rounded-lg border border-[#5c4033]/10">
                                                    <p className="text-sm font-serif text-[#5c4033] break-words pr-6">
                                                        {reply.text}
                                                    </p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-[9px] text-[#5c4033]/40">
                                                            {reply.author.split('@')[0]} • {new Date(reply.createdAt).toLocaleDateString()}
                                                        </span>
                                                        <button
                                                            onClick={() => deleteBottleReply(reply.id)}
                                                            className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                                                            title="Delete reply"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add Reply Section */}
                                <div className="mt-6 pt-4 border-t border-[#5c4033]/10">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                            placeholder="Write a reply..."
                                            className="flex-1 bg-white/50 border border-[#5c4033]/20 rounded px-3 py-2 text-sm font-serif outline-none focus:border-[#5c4033]/40 transition-colors"
                                        />
                                        <button
                                            onClick={handleSendReply}
                                            disabled={isSubmittingReply || !replyText.trim()}
                                            className="bg-[#5c4033] text-[#fdf6e3] px-4 py-2 rounded text-sm font-bold hover:bg-[#3e2c22] transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingReply ? 'Sending...' : 'Reply'}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        onClick={handleReadMessage}
                                        disabled={isMovingBottle}
                                        className="w-full py-3 bg-[#5c4033] text-[#fdf6e3] font-serif font-bold rounded shadow-md hover:bg-[#3e2c22] transition-colors disabled:opacity-50"
                                    >
                                        {isMovingBottle ? 'The bottle is drifting...' : 'Seal and Release 🌊'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Search Button */}
            <button
                onClick={() => setShowSearch(!showSearch)}
                className="absolute top-24 left-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10"
                title="Search location"
            >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* Search Panel */}
            {showSearch && (
                <div className="absolute top-24 left-20 right-4 md:right-auto md:w-96 bg-white rounded-2xl shadow-2xl z-10 overflow-hidden">
                    <div className="p-4">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for a location..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Try: "USM Penang", "Komtar", "Tokyo", etc.
                        </p>
                    </div>
                </div>
            )}

            {/* Current Location Button */}
            <button
                onClick={getCurrentLocation}
                className="absolute top-40 left-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10"
                title="Go to my location"
            >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {/* Location Info Panel */}
            {selectedLocation && (
                <div className="absolute top-4 right-4 bg-white rounded-xl shadow-2xl p-5 max-w-sm z-10">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-xl text-gray-900">{selectedLocation.locationName}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => deleteLocation(selectedLocation.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Delete Location"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setSelectedLocation(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Album Thumbnails Grid */}
                    {locationAlbums[selectedLocation.id] && locationAlbums[selectedLocation.id].length > 0 ? (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Albums</p>
                                {albumCount[selectedLocation.id] > 3 && (
                                    <button
                                        onClick={() => viewAlbums(selectedLocation.id)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        View All ({albumCount[selectedLocation.id]})
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {locationAlbums[selectedLocation.id].map((album) => (
                                    <div
                                        key={album.id}
                                        onClick={() => router.push(`/location/${selectedLocation.id}/albums/${album.id}`)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="aspect-square bg-gradient-to-br from-rose-400 to-pink-400 rounded-lg overflow-hidden hover:scale-105 transition-transform shadow-md">
                                            {(album.customThumbnailUrl || album.thumbnailUrl) ? (
                                                <img
                                                    src={album.customThumbnailUrl || album.thumbnailUrl}
                                                    alt={album.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-white text-2xl">📸</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-700 mt-1 truncate group-hover:text-rose-600 transition-colors">
                                            {album.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {albumCount[selectedLocation.id] <= 3 && (
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    {albumCount[selectedLocation.id]} {albumCount[selectedLocation.id] === 1 ? 'Album' : 'Albums'}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 mb-4 italic">No albums yet</p>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowAlbumModal(true)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all text-sm font-medium shadow-md"
                        >
                            ➕ Create New Album
                        </button>

                        {albumCount[selectedLocation.id] > 0 && (
                            <>
                                <button
                                    onClick={() => router.push(`/location/${selectedLocation.id}/memories`)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium shadow-md flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    📖 View Memories
                                </button>

                                <button
                                    onClick={() => viewAlbums(selectedLocation.id)}
                                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    View All Albums
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-xs z-10">
                <p className="text-xs text-gray-700">
                    <span className="font-semibold">💡 Tip:</span> Click anywhere on the map to add a memory location
                </p>
            </div>

            {/* Album Modal */}
            <AlbumModal
                isOpen={showAlbumModal}
                onClose={() => setShowAlbumModal(false)}
                onSave={createAlbum}
                locationName={selectedLocation?.locationName || ''}
            />
        </div>
    );
}
