'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Location {
    id: string;
    latitude: number;
    longitude: number;
    locationName: string;
    createdAt: string;
}

interface SearchResult {
    id: string;
    place_name: string;
    text?: string;
    place_type?: string[];
    center: [number, number];
    properties?: any;
    context?: any[];
}

export default function MapComponent() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [mapError, setMapError] = useState<string>('');
    const { user } = useAuth();
    const markers = useRef<mapboxgl.Marker[]>([]);


    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        try {
            console.log('Initializing map with token:', mapboxgl.accessToken ? 'Token exists' : 'No token');

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [101.6869, 3.1390], // Kuala Lumpur, Malaysia (default)
                zoom: 10,
                attributionControl: false,
            });

            map.current.on('load', () => {
                console.log('Map loaded successfully!');
            });

            map.current.on('error', (e) => {
                console.error('Map error:', e);
                setMapError('Failed to load map. Please check your Mapbox token.');
            });

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

            // Add geolocate control (current location)
            map.current.addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true
                    },
                    trackUserLocation: true,
                    showUserHeading: true
                }),
                'bottom-right'
            );

            // Add click event to add new location
            map.current.on('click', async (e) => {
                const locationName = prompt('Enter a name for this location:');
                if (locationName) {
                    await addLocation(e.lngLat.lat, e.lngLat.lng, locationName);
                }
            });
        } catch (error) {
            console.error('Error initializing map:', error);
            setMapError(`Map initialization failed: ${error}`);
        }

        return () => {
            map.current?.remove();
        };
    }, []);

    // Load locations from Firestore
    useEffect(() => {
        loadLocations();
    }, [user]);

    // Update markers when locations change
    useEffect(() => {
        if (!map.current) return;

        // Clear existing markers
        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        // Add new markers
        locations.forEach(location => {
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.innerHTML = '📍';
            el.style.fontSize = '32px';
            el.style.cursor = 'pointer';

            const marker = new mapboxgl.Marker(el)
                .setLngLat([location.longitude, location.latitude])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`
              <div style="padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">${location.locationName}</h3>
                <p style="font-size: 12px; color: #666;">
                  ${new Date(location.createdAt).toLocaleDateString()}
                </p>
                <button 
                  onclick="deleteLocation('${location.id}')"
                  style="margin-top: 8px; padding: 4px 8px; background: #ef4444; color: white; border-radius: 4px; font-size: 12px; cursor: pointer; border: none;"
                >
                  Delete
                </button>
              </div>
            `)
                )
                .addTo(map.current!);

            markers.current.push(marker);
        });
    }, [locations]);

    const loadLocations = async () => {
        if (!user) return;
        try {
            const querySnapshot = await getDocs(collection(db, 'locations'));
            const locs: Location[] = [];
            querySnapshot.forEach((doc) => {
                locs.push({ id: doc.id, ...doc.data() } as Location);
            });
            setLocations(locs);
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    };

    const addLocation = async (latitude: number, longitude: number, locationName: string) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'locations'), {
                latitude,
                longitude,
                locationName,
                createdAt: new Date().toISOString(),
            });
            await loadLocations();
        } catch (error) {
            console.error('Error adding location:', error);
            alert('Failed to add location. Please try again.');
        }
    };

    // Search locations using Mapbox Geocoding API
    const searchLocation = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Enhanced search with more specific parameters
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
                `access_token=${mapboxgl.accessToken}` +
                `&limit=10` + // Increased from 5 to 10 results
                `&types=poi,address,place,locality,neighborhood` + // Include POI (points of interest), addresses, and places
                `&proximity=100.3293,5.3547` + // Bias results near Penang, Malaysia
                `&language=en` + // English results
                `&autocomplete=true` + // Enable autocomplete
                `&fuzzyMatch=true` // Enable fuzzy matching for typos
            );
            const data = await response.json();
            console.log('Search results:', data.features); // Debug log
            setSearchResults(data.features || []);
        } catch (error) {
            console.error('Error searching location:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const flyToLocation = (center: [number, number], zoom: number = 14) => {
        if (!map.current) return;
        map.current.flyTo({
            center,
            zoom,
            essential: true,
            duration: 2000,
        });
    };

    const handleSearchResultClick = (result: SearchResult) => {
        flyToLocation(result.center);
        setSearchQuery(result.place_name);
        setSearchResults([]);
        setShowSearch(false);
    };

    // Make deleteLocation available globally for popup buttons
    useEffect(() => {
        (window as any).deleteLocation = async (id: string) => {
            if (confirm('Are you sure you want to delete this location?')) {
                try {
                    await deleteDoc(doc(db, 'locations', id));
                    await loadLocations();
                } catch (error) {
                    console.error('Error deleting location:', error);
                    alert('Failed to delete location. Please try again.');
                }
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Map Container */}
            <div
                ref={mapContainer}
                className="absolute inset-0 w-full h-full"
            />

            {/* Error Message */}
            {mapError && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl shadow-lg z-50 max-w-md">
                    <p className="font-semibold mb-2">⚠️ Map Error</p>
                    <p className="text-sm">{mapError}</p>
                    <p className="text-xs mt-2">Check browser console for details</p>
                </div>
            )}

            {/* Search Button (Mobile-friendly) */}
            <button
                onClick={() => setShowSearch(!showSearch)}
                className="absolute top-4 left-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10"
            >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* Search Panel */}
            {showSearch && (
                <div className="absolute top-4 left-20 right-4 md:right-auto md:w-96 bg-white rounded-2xl shadow-2xl z-10 overflow-hidden">
                    <div className="p-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                searchLocation(e.target.value);
                            }}
                            placeholder="Search for a location..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Search Results */}
                    {isSearching && (
                        <div className="px-4 py-3 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-400 mx-auto"></div>
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="max-h-80 overflow-y-auto">
                            {searchResults.map((result, index) => {
                                // Get place type for icon
                                const placeType = result.place_type?.[0] || 'place';
                                const icon = placeType === 'poi' ? '📍' :
                                    placeType === 'address' ? '🏠' :
                                        placeType === 'place' ? '🌍' :
                                            placeType === 'locality' ? '🏙️' : '📌';

                                return (
                                    <button
                                        key={result.id}
                                        onClick={() => handleSearchResultClick(result)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100 flex items-start gap-3"
                                    >
                                        <span className="text-xl flex-shrink-0">{icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {result.text || result.place_name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {result.place_name}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Instructions (Mobile-friendly) */}
            <div className="absolute bottom-20 md:bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-xs z-10">
                <p className="text-xs text-gray-700">
                    <span className="font-semibold">💡 Tip:</span> Click anywhere on the map to add a memory location
                </p>
            </div>
        </div>
    );
}
