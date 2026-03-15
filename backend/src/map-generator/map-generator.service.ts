import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

@Injectable()
export class MapGeneratorService {
    private readonly logger = new Logger(MapGeneratorService.name);
    private readonly OPENSCAD_PATH = 'C:\\Program Files\\OpenSCAD\\openscad.exe'; // Default path to try

    async generateSvg(bounds: any, options: any, osmData?: any): Promise<string> {
        this.logger.log(`Generating SVG for bounds: ${JSON.stringify(bounds)}`);

        // If the caller already provides OSM data (e.g., fetched client-side), skip the network call
        if (!osmData) {
            osmData = await this.fetchOsmData(bounds);
        } else {
            this.logger.log(`Using pre-fetched OSM data with ${osmData.elements?.length ?? 0} elements`);
        }

        const svg = this.convertToSvg(osmData, bounds, options);
        return svg;
    }

    async generateStl(bounds: any, options: any): Promise<Buffer> {
        const svg = await this.generateSvg(bounds, options);
        const tempDir = path.join(process.cwd(), 'temp', 'maps');
        await fs.mkdir(tempDir, { recursive: true });

        const id = uuidv4();
        const svgPath = path.join(tempDir, `${id}.svg`);
        const scadPath = path.join(tempDir, `${id}.scad`);
        const stlPath = path.join(tempDir, `${id}.stl`);

        try {
            // Save SVG
            await fs.writeFile(svgPath, svg);

            // Generate SCAD
            const scadContent = `
                linear_extrude(height = ${options.reliefHeight || 2})
                import("${svgPath.replace(/\\/g, '/')}");
            `;
            await fs.writeFile(scadPath, scadContent);

            // Run OpenSCAD (if exists)
            try {
                await execAsync(`"${this.OPENSCAD_PATH}" -o "${stlPath}" "${scadPath}"`);
                const stlBuffer = await fs.readFile(stlPath);
                return stlBuffer;
            } catch (err) {
                this.logger.error(`OpenSCAD error: ${err.message}`);
                throw new Error('OpenSCAD not found or failed to render. Please ensure it is installed at C:\\Program Files\\OpenSCAD\\openscad.exe');
            }
        } finally {
            // Cleanup
            await Promise.all([
                this.safeDelete(svgPath),
                this.safeDelete(scadPath),
                this.safeDelete(stlPath)
            ]);
        }
    }

    private async fetchOsmData(bounds: any): Promise<any> {
        const { _southWest, _northEast } = bounds;
        const bbox = `${_southWest.lat},${_southWest.lng},${_northEast.lat},${_northEast.lng}`;
        const query = `[out:json][timeout:30];(way["highway"](${bbox});way["waterway"](${bbox});way["natural"="water"](${bbox}););out body;>;out skel qt;`;

        // Try multiple Overpass API mirrors in sequence
        const OVERPASS_ENDPOINTS = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter',
            'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
        ];

        let lastError: Error | null = null;
        for (const endpoint of OVERPASS_ENDPOINTS) {
            try {
                this.logger.log(`Trying Overpass endpoint: ${endpoint}`);
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout per try

                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: `data=${encodeURIComponent(query)}`,
                    signal: controller.signal,
                });
                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} from ${endpoint}`);
                }

                const data = await response.json();
                this.logger.log(`Successfully fetched ${data.elements?.length ?? 0} OSM elements`);
                return data;
            } catch (err: any) {
                this.logger.warn(`Overpass endpoint failed (${endpoint}): ${err.message}`);
                lastError = err;
            }
        }

        // All endpoints failed — return empty data so we still generate an SVG
        this.logger.error(`All Overpass endpoints failed. Returning empty map. Last error: ${lastError?.message}`);
        return { elements: [] };
    }

    private convertToSvg(osmData: any, bounds: any, options: any): string {
        const { _southWest, _northEast } = bounds;
        const width = 1000;
        const height = 1000;

        const project = (lat: number, lng: number) => {
            const x = ((lng - _southWest.lng) / (_northEast.lng - _southWest.lng)) * width;
            const y = height - ((lat - _southWest.lat) / (_northEast.lat - _southWest.lat)) * height;
            return { x, y };
        };

        const nodesMap = new Map();
        osmData.elements.filter((e: any) => e.type === 'node').forEach((node: any) => {
            nodesMap.set(node.id, project(node.lat, node.lon));
        });

        let paths = '';
        osmData.elements.filter((e: any) => e.type === 'way').forEach((way: any) => {
            const points = way.nodes.map((id: number) => nodesMap.get(id)).filter(Boolean);
            if (points.length < 2) return;

            const d = points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

            const isWater = way.tags?.waterway || way.tags?.natural === 'water';
            const stroke = isWater ? '#3b82f6' : '#000000';
            const strokeWidth = isWater ? 4 : 2;

            paths += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n`;
        });

        // Shape Clipping
        let clipPath = '';
        if (options.shape === 'circle') {
            clipPath = `<clipPath id="shape"><circle cx="500" cy="500" r="480" /></clipPath>`;
        } else if (options.shape === 'square') {
            clipPath = `<clipPath id="shape"><rect x="40" y="40" width="920" height="920" rx="160" /></clipPath>`;
        } else if (options.shape === 'hexagon') {
            clipPath = `<clipPath id="shape"><polygon points="500,40 940,270 940,730 500,960 60,730 60,270" /></clipPath>`;
        } else if (options.shape === 'octagon') {
            clipPath = `<clipPath id="shape"><polygon points="293,40 707,40 960,293 960,707 707,960 293,960 40,707 40,293" /></clipPath>`;
        } else if (options.shape === 'heart') {
            clipPath = `<clipPath id="shape"><path d="M 500,850 C 500,850 80,600 80,340 C 80,130 225,130 355,130 C 430,130 475,210 500,260 C 525,210 570,130 645,130 C 775,130 920,130 920,340 C 920,600 500,850 500,850 Z" /></clipPath>`;
        } else if (options.shape === 'star') {
            clipPath = `<clipPath id="shape"><polygon points="500,50 594,345 916,345 664,537 757,830 500,640 243,830 336,537 84,345 406,345" /></clipPath>`;
        }

        const viewBox = `0 0 ${width} ${height}`;
        return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        ${clipPath}
    </defs>
    <g ${clipPath ? 'clip-path="url(#shape)"' : ''}>
        <rect width="100%" height="100%" fill="#ffffff" />
        ${paths}
    </g>
    ${options.showText ? `
    <text x="500" y="940" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="900" font-size="40" fill="#0f172a" style="text-transform: uppercase; letter-spacing: 2px;">${options.text || 'Nossa História'}</text>
    <text x="500" y="975" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="18" fill="#3b82f6" style="text-transform: uppercase; letter-spacing: 4px;">${options.subtext || 'Sempre Juntos'}</text>
    ` : ''}
</svg>`;
    }

    private async safeDelete(filePath: string) {
        try {
            await fs.unlink(filePath);
        } catch { }
    }
}
