"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
    Map as MapIcon, 
    Layers, 
    Type, 
    Box, 
    Download,
    Search,
    ChevronDown,
    ChevronUp,
    Loader2,
    Plus,
    Minus,
    Maximize,
    Undo2,
    Redo2,
    X,
    Heart,
    Star,
    Circle,
    Square
} from 'lucide-react';

import api from '@/lib/api';
import dynamic from 'next/dynamic';
import type { MemoryMapHandle } from '@/components/map/MemoryMap';

const MemoryMap = dynamic(() => import('@/components/map/MemoryMap'), { 
    ssr: false,
});

// ─── Shape Definitions ────────────────────────────────────────────────────────

/** SVG paths/elements for guide overlay (viewBox 0 0 300 300) */
const SHAPE_GUIDE: Record<string, React.ReactNode> = {
    circle:  <circle cx="150" cy="150" r="138" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6,5" />,
    square:  <path d="M 258,12 L 263.85,12.58 L 269.48,14.28 L 274.67,17.06 L 279.21,20.79 L 282.94,25.33 L 285.72,30.52 L 287.42,36.15 L 288,42 L 288,258 L 287.42,263.85 L 285.72,269.48 L 282.94,274.67 L 279.21,279.21 L 274.67,282.94 L 269.48,285.72 L 263.85,287.42 L 258,288 L 42,288 L 36.15,287.42 L 30.52,285.72 L 25.33,282.94 L 20.79,279.21 L 17.06,274.67 L 14.28,269.48 L 12.58,263.85 L 12,258 L 12,42 L 12.58,36.15 L 14.28,30.52 L 17.06,25.33 L 20.79,20.79 L 25.33,17.06 L 30.52,14.28 L 36.15,12.58 L 42,12 Z" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6,5" />,
    hexagon: <polygon points="150,12 270,81 270,219 150,288 30,219 30,81" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6,5" />,
    octagon: <polygon points="105,12 195,12 276,93 276,207 195,288 105,288 24,207 24,93" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6,5" />,
    heart:   <path d="M 150,255 C 150,255 25,175 25,100 C 25,40 72,40 105,40 C 128,40 143,63 150,79 C 157,63 172,40 195,40 C 228,40 275,40 275,100 C 275,175 150,255 150,255 Z" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6,5" />,
    star:    <polygon points="150,15 179,105 275,105 200,161 225,255 150,200 75,255 100,161 25,105 121,105" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6,5" />,
};

/** clipPath definitions for the preview modal SVG */
const CLIP_DEFS: Record<string, React.ReactNode> = {
    circle:  <circle cx="250" cy="250" r="230" />,
    square:  <path d="M 430,20 L 437,20.97 L 449,23.8 L 458,28.43 L 465,34.79 L 471,42.22 L 475,50.87 L 478,60.25 L 480,70 L 480,430 L 478,439.75 L 475,449.13 L 471,457.78 L 465,465.21 L 458,471.57 L 449,476.2 L 437,479.03 L 430,480 L 70,480 L 60.25,479.03 L 50.87,476.2 L 42.22,471.57 L 34.79,465.21 L 28.43,458 L 23.8,449.13 L 20.97,439.75 L 20,430 L 20,70 L 20.97,60.25 L 23.8,50.87 L 28.43,42.22 L 34.79,34.79 L 42.22,28.43 L 50.87,23.8 L 60.25,20.97 L 70,20 Z" />,
    hexagon: <polygon points="250,20 450,135 450,365 250,480 50,365 50,135" />,
    octagon: <polygon points="175,20 325,20 460,155 460,345 325,480 175,480 40,345 40,155" />,
    heart:   <path d="M 250,425 C 250,425 42,292 42,167 C 42,67 120,67 175,67 C 213,67 238,105 250,132 C 262,105 287,67 325,67 C 380,67 458,67 458,167 C 458,292 250,425 250,425 Z" />,
    star:    <polygon points="250,25 298,175 458,175 333,268 375,425 250,333 125,425 167,268 42,175 202,175" />,
};

// ─── Shape Selector Options ───────────────────────────────────────────────────

const SHAPES = [
    { id: 'circle',  label: 'Círculo',    icon: <Circle size={15} /> },
    { id: 'square',  label: 'Quadrado',   icon: <Square size={15} /> },
    { id: 'hexagon', label: 'Hexágono',   icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" /></svg> },
    { id: 'octagon', label: 'Octógono',   icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="7.86,2 16.14,2 22,7.86 22,16.14 16.14,22 7.86,22 2,16.14 2,7.86" /></svg> },
    { id: 'heart',   label: 'Coração',    icon: <Heart size={15} /> },
    { id: 'star',    label: 'Estrela',    icon: <Star size={15} /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MemoryMapPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
    const [openSection, setOpenSection] = useState<string | null>('shape');
    const [generateError, setGenerateError] = useState<string | null>(null);
    const mapControlRef = useRef<MemoryMapHandle>(null);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [mapState, setMapState] = useState<{
        lat: number;
        lng: number;
        zoom: number;
        bounds?: any;
    } | null>(null);

    const [options, setOptions] = useState({
        shape: 'circle',
        showText: true,
        text: 'Nossa História',
        subtext: 'Sempre Juntos',
        reliefHeight: 2,
        captureSize: 450,
    });

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
            setSearchResults(await res.json());
        } catch { } finally {
            setIsSearching(false);
        }
    };

    const selectLocation = (result: any) => {
        setMapState({ lat: parseFloat(result.lat), lng: parseFloat(result.lon), zoom: 15 });
        setSearchResults([]);
        setSearchQuery(result.display_name);
        setGeneratedSvg(null);
    };

    const handleLocationSelect = useCallback((lat: number, lng: number, zoom: number, bounds: any) => {
        setMapState(prev => {
            if (prev?.lat === lat && prev?.lng === lng && prev?.zoom === zoom) return prev;
            return { lat, lng, zoom, bounds };
        });
    }, []);

    const initialCenter = useMemo(() =>
        mapState ? [mapState.lat, mapState.lng] as [number, number] : undefined
    , [mapState?.lat, mapState?.lng]);

    const OVERPASS_MIRRORS = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    ];

    const handleGeneratePreview = async () => {
        if (!mapState?.bounds) return;
        setIsGenerating(true);
        setGenerateError(null);
        try {
            // Step 1: Fetch OSM data from the browser (avoids Docker network restrictions)
            const { _southWest, _northEast } = mapState.bounds;
            const bbox = `${_southWest.lat},${_southWest.lng},${_northEast.lat},${_northEast.lng}`;
            const overpassQuery = `[out:json][timeout:25];(way["highway"](${bbox});way["waterway"](${bbox});way["natural"="water"](${bbox}););out body;>;out skel qt;`;
            
            let osmData: any = null;
            let lastStatus = 0;

            for (const mirror of OVERPASS_MIRRORS) {
                try {
                    const osmResponse = await fetch(mirror, {
                        method: 'POST',
                        body: `data=${encodeURIComponent(overpassQuery)}`,
                        signal: AbortSignal.timeout(20000),
                    });
                    lastStatus = osmResponse.status;
                    if (osmResponse.ok) {
                        osmData = await osmResponse.json();
                        break;
                    }
                    console.warn(`Overpass mirror ${mirror} returned ${osmResponse.status}`);
                } catch (err: any) {
                    console.warn(`Overpass mirror ${mirror} failed:`, err.message);
                }
            }

            if (!osmData) {
                throw new Error(`Overpass API indisponível (último status: ${lastStatus}). Tente novamente em instantes.`);
            }

            // Step 2: Send OSM data + options to backend for SVG generation
            const response = await api.post('/map-generator/svg', { bounds: mapState.bounds, options, osmData });
            setGeneratedSvg(response.data);
        } catch (error: any) {
            console.error('Generation error:', error);
            setGenerateError(error.message || 'Erro ao gerar prévia');
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadSvg = () => {
        if (!generatedSvg) return;
        const blob = new Blob([generatedSvg], { type: 'image/svg+xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mapa-${options.text || 'memoria'}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const downloadStl = async () => {
        if (!mapState?.bounds) return;
        try {
            const response = await api.post('/map-generator/stl', { bounds: mapState.bounds, options }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `mapa-${options.text || 'memoria'}.stl`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('STL error:', error);
        }
    };

    const toggleSection = (id: string) => setOpenSection(openSection === id ? null : id);
    const clipId = `preview-clip-${options.shape}`;

    return (
        <div className="h-screen w-screen overflow-hidden flex bg-slate-50 relative font-sans">
            
            {/* ── 1. Main Map Canvas ──────────────────────────────────── */}
            <div className="absolute inset-0 z-0">
                {isMounted ? (
                    <MemoryMap
                        ref={mapControlRef}
                        onLocationSelect={handleLocationSelect}
                        initialCenter={initialCenter}
                        lightMode={true}
                    />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">
                        Iniciando Motor...
                    </div>
                )}
                
                {/* ── Capture Guide (SVG) ── */}
                {!generatedSvg && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center lg:pr-[350px] z-[50]">
                        <div 
                            className="relative flex items-center justify-center transition-all duration-300"
                            style={{ width: options.captureSize, height: options.captureSize }}
                        >
                            {/* Dark vignette outside the guide */}
                            <div 
                                className="absolute inset-0 pointer-events-none rounded-full"
                                style={{ boxShadow: '0 0 0 4000px rgba(15, 23, 42, 0.10)' }} 
                            />
                            
                            <svg 
                                width={options.captureSize} 
                                height={options.captureSize} 
                                viewBox="0 0 300 300"
                                className="transition-all duration-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.25)]"
                            >
                                {SHAPE_GUIDE[options.shape]}
                            </svg>

                            {/* Label badge */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-xl border border-blue-100 flex items-center gap-2 whitespace-nowrap">
                                <Maximize className="text-blue-600 animate-pulse" size={11} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">
                                    Enquadre o Mapa
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Preview Modal ── */}
                {generatedSvg && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center lg:pr-[350px] bg-slate-900/20 backdrop-blur-[3px]">
                        <div className="relative flex flex-col items-center gap-4 p-8">

                            {/* Shaped SVG Preview */}
                            <div 
                                className="relative shadow-[0_30px_80px_rgba(0,0,0,0.2)] transition-all duration-500"
                                style={{ width: options.captureSize, height: options.captureSize }}
                            >
                                <svg
                                    width={options.captureSize}
                                    height={options.captureSize}
                                    viewBox="0 0 500 500"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <defs>
                                        <clipPath id={clipId}>
                                            {CLIP_DEFS[options.shape]}
                                        </clipPath>
                                    </defs>
                                    {/* White background clipped to shape */}
                                    <rect width="500" height="500" fill="white" clipPath={`url(#${clipId})`} />
                                    {/* Map SVG content */}
                                    <g clipPath={`url(#${clipId})`} dangerouslySetInnerHTML={{ __html: 
                                        // Extract inner content from the SVG string
                                        generatedSvg.replace(/<\?xml[^>]*>/i, '')
                                            .replace(/<svg[^>]*>/i, '')
                                            .replace(/<\/svg>/i, '')
                                    }} />
                                    {/* Shape border */}
                                    <g fill="none" stroke="#e2e8f0" strokeWidth="2">
                                        {CLIP_DEFS[options.shape]}
                                    </g>
                                </svg>
                            </div>

                            {/* Action bar */}
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setGeneratedSvg(null)}
                                    className="bg-white/90 backdrop-blur px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600 shadow-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                                >
                                    <X size={12} />
                                    Fechar
                                </button>
                                <button 
                                    onClick={downloadSvg}
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                                >
                                    <Download size={12} />
                                    Baixar SVG
                                </button>
                                <button 
                                    onClick={downloadStl}
                                    className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2"
                                >
                                    <Download size={12} />
                                    Baixar STL
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 2. Search Bar ────────────────────────────────────────── */}
            <div className="absolute top-8 left-8 z-30 w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden ring-1 ring-slate-900/5 transition-all focus-within:ring-2 focus-within:ring-blue-500">
                    <form onSubmit={handleSearch} className="flex items-center px-4 py-3 gap-3">
                        <Search size={20} className="text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar localização..."
                            className="bg-transparent border-none outline-none flex-1 font-bold text-sm text-slate-700 placeholder:text-slate-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {isSearching && <Loader2 className="animate-spin text-blue-500" size={18} />}
                    </form>
                    {searchResults.length > 0 && (
                        <div className="border-t border-slate-100 max-h-60 overflow-y-auto">
                            {searchResults.map((result, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => selectLocation(result)}
                                    className="w-full text-left px-5 py-3 hover:bg-blue-50 text-xs font-bold text-slate-600 border-b border-slate-50 last:border-0 transition-colors"
                                >
                                    {result.display_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── 3. Map Controls ──────────────────────────────────────── */}
            <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-2">
                <button 
                    onClick={() => mapControlRef.current?.zoomIn()}
                    className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:scale-105 transition-all font-bold text-xl"
                    title="Aproximar"
                >
                    <Plus size={20} />
                </button>
                <button 
                    onClick={() => mapControlRef.current?.zoomOut()}
                    className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:scale-105 transition-all"
                    title="Afastar"
                >
                    <Minus size={20} />
                </button>
            </div>

            {/* ── 4. Right Sidebar ─────────────────────────────────────── */}
            <aside className="fixed top-0 right-0 h-full w-[350px] bg-white border-l border-slate-200 z-40 shadow-[-10px_0_50px_rgba(0,0,0,0.05)] flex flex-col">
                
                {/* Header */}
                <div className="px-6 py-8 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <MapIcon size={18} />
                        </div>
                        <h1 className="font-black text-xs uppercase tracking-widest text-slate-900 italic">Memory<span className="text-blue-600">Map</span></h1>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    
                    {/* Section: Shape & Format */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                        <button 
                            onClick={() => toggleSection('shape')}
                            className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Layers size={14} className="text-blue-500" />
                                Shape & Map
                            </span>
                            {openSection === 'shape' ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
                        </button>
                        
                        {openSection === 'shape' && (
                            <div className="p-4 pt-0 space-y-4">
                                
                                {/* Boundary Shape title */}
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Boundary Shape</p>
                                
                                {/* Shape grid (2 columns) */}
                                <div className="grid grid-cols-2 gap-2">
                                    {SHAPES.map((item) => (
                                        <button 
                                            key={item.id}
                                            onClick={() => setOptions({ ...options, shape: item.id })}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
                                                options.shape === item.id 
                                                    ? 'bg-blue-50 border-blue-500 text-blue-600' 
                                                    : 'border-slate-100 text-slate-400 bg-white hover:border-slate-200'
                                            }`}
                                        >
                                            <span className={options.shape === item.id ? 'text-blue-500' : 'text-slate-300'}>{item.icon}</span>
                                            <span className="text-[8px] font-black uppercase tracking-tight">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Capture Size slider */}
                                <div className="space-y-2 pt-1">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Capture Size</label>
                                        <span className="text-[8px] font-black text-blue-600">{options.captureSize}px</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="200" 
                                        max="800" 
                                        step="25"
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        value={options.captureSize}
                                        onChange={(e) => setOptions({ ...options, captureSize: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Text & Labels */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                        <button 
                            onClick={() => toggleSection('text')}
                            className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Type size={14} className="text-blue-500" />
                                Texto & Legendas
                            </span>
                            {openSection === 'text' ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
                        </button>
                        {openSection === 'text' && (
                            <div className="p-4 pt-0 space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Título (ex: Paris)"
                                    className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500 rounded-xl py-3 px-4 font-bold text-xs outline-none transition-all placeholder:text-slate-300"
                                    value={options.text}
                                    onChange={(e) => setOptions({ ...options, text: e.target.value })}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Subtítulo (ex: 2024)"
                                    className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500 rounded-xl py-3 px-4 font-bold text-xs outline-none transition-all placeholder:text-slate-300"
                                    value={options.subtext}
                                    onChange={(e) => setOptions({ ...options, subtext: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    {/* Section: 3D Heights */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                        <button 
                            onClick={() => toggleSection('height')}
                            className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Box size={14} className="text-blue-500" />
                                Alturas 3D (mm)
                            </span>
                            {openSection === 'height' ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
                        </button>
                        {openSection === 'height' && (
                            <div className="p-4 pt-0 space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Espessura do Relevo</label>
                                    <span className="text-[8px] font-black text-blue-600">{options.reliefHeight}mm</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    step="0.5"
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    value={options.reliefHeight}
                                    onChange={(e) => setOptions({ ...options, reliefHeight: Number(e.target.value) })}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 space-y-3">
                    {generateError && (
                        <div className="text-[8px] font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg leading-relaxed">
                            ⚠️ {generateError}
                        </div>
                    )}
                    <button 
                        onClick={handleGeneratePreview}
                        disabled={isGenerating || !mapState}
                        className="w-full bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-xl shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Maximize size={18} />}
                        {isGenerating ? 'Calculando...' : 'Gerar Prévia'}
                    </button>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={downloadSvg}
                            disabled={!generatedSvg}
                            className="bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[8px] py-3 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-30"
                        >SVG</button>
                        <button 
                            disabled={!generatedSvg}
                            className="bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[8px] py-3 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-30"
                        >PNG</button>
                        <button 
                            onClick={downloadStl}
                            disabled={!generatedSvg}
                            className="bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[8px] py-3 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-30"
                        >STL</button>
                    </div>

                    <div className="pt-2 flex justify-center">
                        <p className="text-[8px] font-black text-slate-200 uppercase tracking-widest">v1.2 Stable Engine</p>
                    </div>
                </div>
            </aside>

            {/* ── 5. Coordinate Info ────────────────────────────────────── */}
            {mapState && (
                <div className="absolute bottom-8 right-[370px] z-30 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 shadow-lg text-[8px] font-bold text-slate-400 font-mono space-y-0.5">
                    <div>LAT: {mapState.lat.toFixed(4)}</div>
                    <div>LNG: {mapState.lng.toFixed(4)}</div>
                    <div>ZOOM: {mapState.zoom}</div>
                </div>
            )}
        </div>
    );
}
