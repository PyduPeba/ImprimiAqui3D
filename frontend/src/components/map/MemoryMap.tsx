"use client";

import React, { useEffect, useRef, memo, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MemoryMapProps {
    onLocationSelect: (lat: number, lng: number, zoom: number, bounds: L.LatLngBounds) => void;
    initialCenter?: [number, number];
    initialZoom?: number;
    lightMode?: boolean;
}

export interface MemoryMapHandle {
    zoomIn: () => void;
    zoomOut: () => void;
}

const MemoryMap = memo(forwardRef<MemoryMapHandle, MemoryMapProps>(
    ({ onLocationSelect, initialCenter = [-23.5505, -46.6333], initialZoom = 15, lightMode = true }, ref) => {
        const mapRef = useRef<HTMLDivElement>(null);
        const leafletMap = useRef<L.Map | null>(null);
        
        const onLocationSelectRef = useRef(onLocationSelect);
        useEffect(() => { onLocationSelectRef.current = onLocationSelect; }, [onLocationSelect]);

        // Expose zoom controls to parent via ref
        useImperativeHandle(ref, () => ({
            zoomIn: () => leafletMap.current?.zoomIn(),
            zoomOut: () => leafletMap.current?.zoomOut(),
        }));

        useEffect(() => {
            if (!mapRef.current || leafletMap.current) return;

            leafletMap.current = L.map(mapRef.current, {
                center: initialCenter,
                zoom: initialZoom,
                zoomControl: false,
                attributionControl: false,
            });

            const tileUrl = lightMode 
                ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

            L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(leafletMap.current);

            // Ensure map renders correctly after CSR mount
            setTimeout(() => leafletMap.current?.invalidateSize(), 100);

            leafletMap.current.on('moveend', () => {
                if (!leafletMap.current) return;
                const center = leafletMap.current.getCenter();
                const zoom = leafletMap.current.getZoom();
                const bounds = leafletMap.current.getBounds();
                onLocationSelectRef.current(center.lat, center.lng, zoom, bounds);
            });

            const bounds = leafletMap.current.getBounds();
            onLocationSelectRef.current(initialCenter[0], initialCenter[1], initialZoom, bounds);

            return () => {
                leafletMap.current?.remove();
                leafletMap.current = null;
            };
        }, []);

        // Sync external location changes (e.g., search)
        useEffect(() => {
            if (!leafletMap.current || !initialCenter) return;
            const currentCenter = leafletMap.current.getCenter();
            const distance = L.latLng(initialCenter[0], initialCenter[1]).distanceTo(currentCenter);
            if (distance > 1 || leafletMap.current.getZoom() !== initialZoom) {
                leafletMap.current.setView(initialCenter, initialZoom, { animate: true, duration: 1 });
            }
        }, [initialCenter?.[0], initialCenter?.[1], initialZoom]);

        return <div ref={mapRef} className="w-full h-full" />;
    }
));

MemoryMap.displayName = 'MemoryMap';
export default MemoryMap;
