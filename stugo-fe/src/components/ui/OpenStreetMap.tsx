import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface OpenStreetMapProps {
    latitude: number;
    longitude: number;
    title: string;
    address: string;
}

const OpenStreetMap = ({ latitude, longitude, title, address }: OpenStreetMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map
        const map = L.map(mapRef.current).setView([latitude, longitude], 15);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        // Add marker
        const marker = L.marker([latitude, longitude]).addTo(map);

        // Add popup
        marker.bindPopup(`
            <div style="padding: 8px; min-width: 200px;">
                <h3 style="font-weight: 600; margin-bottom: 4px; color: #1f2937; font-size: 16px;">${title}</h3>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">${address}</p>
            </div>
        `);

        mapInstanceRef.current = map;

        // Cleanup
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [latitude, longitude, title, address]);

    return <div ref={mapRef} className="w-full h-full rounded-xl" />;
};

export default OpenStreetMap;
