'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function MapComponentSimple() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('MapComponent mounted!');
        console.log('Mapbox token:', mapboxgl.accessToken ? 'EXISTS' : 'MISSING');

        if (!mapContainer.current) {
            console.log('Map container not found!');
            return;
        }

        if (map.current) {
            console.log('Map already initialized');
            return;
        }

        try {
            console.log('Creating map...');

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [100.3293, 5.3547], // Penang
                zoom: 12,
            });

            map.current.on('load', () => {
                console.log('✅ MAP LOADED SUCCESSFULLY!');
            });

            map.current.on('error', (e) => {
                console.error('❌ Map error:', e);
                setError('Map failed to load');
            });

        } catch (err) {
            console.error('❌ Error creating map:', err);
            setError(`Failed to create map: ${err}`);
        }

        return () => {
            console.log('Cleaning up map...');
            map.current?.remove();
        };
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full bg-gray-100">
            <div
                ref={mapContainer}
                className="absolute inset-0 w-full h-full"
            />

            {error && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-100 border-2 border-red-500 text-red-800 p-6 rounded-lg z-50 max-w-md">
                    <p className="font-bold text-lg mb-2">⚠️ Error</p>
                    <p className="whitespace-pre-line text-sm">{error}</p>
                </div>
            )}

            <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg z-10">
                <p className="text-sm font-semibold">Map Test</p>
                <p className="text-xs text-gray-600">Check console for logs</p>
            </div>
        </div>
    );
}
