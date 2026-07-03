import { apiFetch } from '@/lib/api';

export interface ModeCatalogEntry {
    game: string;
    mode: string;
    label: string;
    type: string;
}

export const GAME_LABELS: Record<string, string> = {
    'flag-quiz': 'Quiz drapeaux',
    'shape-quiz': 'Quiz pays',
};

export async function fetchModeCatalog(): Promise<ModeCatalogEntry[]> {
    const response = await apiFetch<{ modes: ModeCatalogEntry[] }>('/api/leaderboards/catalog');

    return response.modes;
}

export function groupModesByGame(catalog: ModeCatalogEntry[]): Record<string, ModeCatalogEntry[]> {
    const grouped: Record<string, ModeCatalogEntry[]> = {};

    for (const entry of catalog) {
        grouped[entry.game] ??= [];
        grouped[entry.game].push(entry);
    }

    return grouped;
}
