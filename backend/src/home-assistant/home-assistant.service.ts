import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface PrinterData {
    id: string;
    name: string;
    status: 'printing' | 'idle' | 'offline';
    file: string;
    progress: number;
    eta: string;
}

@Injectable()
export class HomeAssistantService {
    private readonly logger = new Logger(HomeAssistantService.name);
    // Hardcoded for now. In production, this goes to .env
    private readonly haUrl = 'http://192.168.18.240:8123';
    private readonly haToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiNWE3NGYzYTg0YzI0YTliODA4NWNkNzZlMzVjYTk4MyIsImlhdCI6MTc3Mzc2MzcwNCwiZXhwIjoyMDg5MTIzNzA0fQ.vso09LvHNcoMgk0udlYitN-WRmarc1wQMQqAUQuvSOc';

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
                if (state.entity_id.endsWith('_status') || state.entity_id.endsWith('_print_status')) {
                    if (state.entity_id.includes('ad5x') || state.entity_id.includes('flashforge')) {
                        baseId = state.entity_id.replace('_status', '').replace('_print', '');
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
                        if (state.entity_id.endsWith('_file_name') || state.entity_id.endsWith('_file')) { 
                            printer.file = (state.state === 'unknown' || state.state === '') ? '—' : state.state; 
                        }
                        if (state.entity_id.endsWith('_job_percentage')) { 
                            printer.progress = parseInt(state.state) || 0; 
                        }
                        if (state.entity_id.endsWith('_current_print_time')) { 
                            printer._current = parseFloat(state.state); 
                        }
                        if (state.entity_id.endsWith('_remaining_print_time')) { 
                            printer._remain = parseFloat(state.state); 
                        }
                    }
                }
            }

            // Pass 3: Processar Status e ETA
            for (const printer of printersMap.values()) {
                if (printer._rawStatus === 'printing' || printer._rawStatus === 'busy') {
                    printer.status = 'printing';
                } else if (printer._rawStatus === 'ready' || printer._rawStatus === 'idle' || printer._rawStatus === 'completed') {
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
