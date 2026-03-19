import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface PrinterData {
    id: string;
    name: string;
    status: 'printing' | 'idle' | 'offline' | 'paused';
    file: string;
    progress: number;
    eta: string;
}

export type PrinterCommand = 'pause' | 'resume' | 'abort';

@Injectable()
export class HomeAssistantService {
    private readonly logger = new Logger(HomeAssistantService.name);
    private readonly haUrl = process.env.HA_URL || 'http://192.168.18.240:8123';
    private readonly haToken = process.env.HA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiNWE3NGYzYTg0YzI0YTliODA4NWNkNzZlMzVjYTk4MyIsImlhdCI6MTc3Mzc2MzcwNCwiZXhwIjoyMDg5MTIzNzA0fQ.vso09LvHNcoMgk0udlYitN-WRmarc1wQMQqAUQuvSOc';

    private readonly headers = () => ({
        Authorization: `Bearer ${this.haToken}`,
        'Content-Type': 'application/json',
    });

    /**
     * Sends a generic command (pause/resume/abort) to a printer via Home Assistant.
     * Handles hardware-specific entity naming (Elegoo/Moonraker vs Flashforge).
     *
     * @param baseEntityId - The base entity prefix (e.g., "ad5x" or "centauri_carbon_2")
     * @param command - The generic command to send
     */
    async sendCommand(baseEntityId: string, command: PrinterCommand): Promise<void> {
        // Map generic commands to specific entity IDs per hardware type
        const entityMap: Record<PrinterCommand, string> = {
            pause:  `button.${baseEntityId}_pause_print`,   // Elegoo/Moonraker
            resume: `button.${baseEntityId}_resume_print`,
            abort:  `button.${baseEntityId}_stop_print`,
        };

        // Flashforge AD5X: support both old and new (GhostTypes) integration naming
        const flashforgeEntityMap: Record<PrinterCommand, string[]> = {
            pause:  [`button.${baseEntityId}_pause_print`, `button.${baseEntityId}_pause`],
            resume: [`button.${baseEntityId}_resume_print`, `button.${baseEntityId}_continue`],
            abort:  [`button.${baseEntityId}_cancel_print`, `button.${baseEntityId}_abort`],
        };

        // Detect Flashforge by entity prefix naming convention
        const isFlashforge = baseEntityId.includes('ad5x') || baseEntityId.includes('ff_') || baseEntityId.includes('flashforge');
        const entityId = isFlashforge ? flashforgeEntityMap[command][0] : entityMap[command];

        this.logger.log(`Sending HA command: ${command} → entity: ${entityId}`);

        await axios.post(
            `${this.haUrl}/api/services/button/press`,
            { entity_id: entityId },
            { headers: this.headers() },
        );
    }

    async getPrinters(): Promise<PrinterData[]> {
        try {
            const response = await axios.get(`${this.haUrl}/api/states`, {
                headers: {
                    Authorization: `Bearer ${this.haToken}`,
                    'Content-Type': 'application/json',
                },
            });

            const states = response.data;
            const printersMap = new Map<string, any>();

            // Pass 1: Identificar as impressoras pelos sensores de status base
            for (const state of states) {
                let baseId = '';
                if (state.entity_id.endsWith('_status') || state.entity_id.endsWith('_print_status') || state.entity_id.endsWith('_machine_status')) {
                    if (state.entity_id.includes('ad5x') || state.entity_id.includes('flashforge') || state.entity_id.includes('ff_')) {
                        baseId = state.entity_id.replace('_status', '').replace('_print', '').replace('_machine', '');
                    } else if (state.entity_id.includes('centauri') || state.entity_id.includes('elegoo')) {
                        baseId = state.entity_id.replace('_print_status', '');
                    }
                    
                    if (baseId && !printersMap.has(baseId)) {
                        const friendlyName = state.attributes?.friendly_name?.replace(' Print Status', '')?.replace(' Status', '') || baseId;
                        printersMap.set(baseId, {
                            id: baseId,
                            name: friendlyName,
                            status: 'idle',
                            file: '—',
                            progress: 0,
                            eta: '—',
                            _rawStatus: state.state.toLowerCase()
                        });
                    }
                }
            }

            // Pass 2: Capturar atributos de arquivos e progresso
            for (const state of states) {
                for (const [baseId, printer] of printersMap.entries()) {
                    if (state.entity_id.startsWith(baseId)) {
                        if (state.entity_id.endsWith('_file_name') || state.entity_id.endsWith('_file') || state.entity_id.endsWith('_current_file')) { 
                            printer.file = (state.state === 'unknown' || state.state === '') ? '—' : state.state; 
                        }
                        if (state.entity_id.endsWith('_job_percentage') || state.entity_id.endsWith('_print_progress')) { 
                            printer.progress = parseInt(state.state) || 0; 
                        }
                        if (state.entity_id.endsWith('_current_print_time') || state.entity_id.endsWith('_elapsed_time')) { 
                            printer._current = parseFloat(state.state); 
                        }
                        if (state.entity_id.endsWith('_remaining_print_time') || state.entity_id.endsWith('_remaining_time')) { 
                            printer._remain = parseFloat(state.state); 
                        }
                    }
                }
            }

            // Pass 3: Processar Status e ETA
            for (const printer of printersMap.values()) {
                // Flashforge AD5X: uses "building" when printing
                if (printer._rawStatus === 'printing' || printer._rawStatus === 'busy' || printer._rawStatus === 'building') {
                    printer.status = 'printing';
                } else if (printer._rawStatus === 'paused') {
                    printer.status = 'paused';
                } else if (printer._rawStatus === 'ready' || printer._rawStatus === 'idle' || printer._rawStatus === 'completed' || printer._rawStatus === 'cancelled') {
                    printer.status = 'idle';
                } else if (printer._rawStatus === 'unavailable' || printer._rawStatus === 'unknown' || printer._rawStatus === 'offline') {
                    printer.status = 'offline';
                }

                // Elegoo ETA and Progress Calc (using minutes)
                if (printer._current !== undefined && printer._remain !== undefined && printer._remain > 0) {
                    const total = printer._current + printer._remain;
                    if (!printer.progress) printer.progress = Math.round((printer._current / total) * 100);
                    const hours = Math.floor(printer._remain / 60);
                    const mins = Math.round(printer._remain % 60);
                    printer.eta = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                } else if (printer.status === 'printing') {
                    printer.eta = 'Verificando...';
                }
                
                // Cleanup temp variables
                delete printer._rawStatus;
                delete printer._current;
                delete printer._remain;
            }

            return Array.from(printersMap.values());

        } catch (error) {
            this.logger.error('Failed to fetch data from Home Assistant', error);
            return [];
        }
    }
}
