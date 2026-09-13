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
    'logo-quiz': 'Quiz logos',
    'pile-ou-face': 'Pile ou face',
    'blackjack': 'Blackjack',
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

export interface ModeCatalogGroup {
    id: string;
    label: string;
    modes: ModeCatalogEntry[];
}

export function chronoMinutes(mode: string): number {
    const match = /^chrono:(\d+)$/.exec(mode);

    return match ? Number(match[1]) : 0;
}

export function chronoDurationLabel(mode: string): string {
    const minutes = chronoMinutes(mode);

    return minutes > 0 ? `${minutes} min` : mode;
}

const MODE_GROUP_LABELS: Record<string, string> = {
    chrono: 'Contre-la-montre',
    aveugle: 'Aveugle',
    category: 'Catégories',
};

function modeGroupId(mode: string): string | null {
    if (mode.startsWith('chrono:')) {
        return 'chrono';
    }

    if (mode === 'aveugle' || mode.startsWith('aveugle:')) {
        return 'aveugle';
    }

    if (mode.startsWith('category:')) {
        return 'category';
    }

    return null;
}

export function variantLabel(entry: ModeCatalogEntry): string {
    if (entry.mode.startsWith('chrono:')) {
        return chronoDurationLabel(entry.mode);
    }

    const separator = ' · ';
    const index = entry.label.indexOf(separator);

    return index === -1 ? entry.label : entry.label.slice(index + separator.length);
}

export function hasModeVariants(group: ModeCatalogGroup | undefined): group is ModeCatalogGroup {
    return (group?.modes.length ?? 0) > 1;
}

export function variantGroupAriaLabel(group: ModeCatalogGroup): string {
    if (group.id === 'chrono') {
        return 'Durée du contre-la-montre';
    }

    if (group.id === 'aveugle') {
        return 'Variante du mode aveugle';
    }

    if (group.id === 'category') {
        return 'Catégorie de logos';
    }

    return 'Variante du mode';
}

export function groupCatalogModes(entries: ModeCatalogEntry[]): ModeCatalogGroup[] {
    const groups: ModeCatalogGroup[] = [];
    const grouped = new Map<string, ModeCatalogGroup>();

    for (const entry of entries) {
        const groupId = modeGroupId(entry.mode);

        if (!groupId) {
            groups.push({ id: entry.mode, label: entry.label, modes: [entry] });
            continue;
        }

        let group = grouped.get(groupId);

        if (!group) {
            group = {
                id: groupId,
                label: MODE_GROUP_LABELS[groupId] ?? groupId,
                modes: [],
            };
            grouped.set(groupId, group);
            groups.push(group);
        }

        group.modes.push(entry);
    }

    grouped.get('chrono')?.modes.sort((left, right) => chronoMinutes(left.mode) - chronoMinutes(right.mode));

    return groups;
}
