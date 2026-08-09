import { isGamePath, pathSegments } from '@/shared/path';

export type FlagQuizModeId = 'tous' | 'chrono' | 'pays' | 'aveugle';

export type CountryPool = 'all' | 'sovereign';

export interface FlagQuizMode {
    id: FlagQuizModeId;
    title: string;
    description: string;
    href: string;
    icon: string;
    pool: CountryPool;
    timeLimitMs?: number;
    hideVisual?: boolean;
    freeEntry?: boolean;
    endOnComplete: boolean;
}

export interface ChronoDurationOption {
    minutes: number;
    label: string;
}

export interface BlindPoolOption {
    id: 'tous' | 'pays';
    label: string;
    description: string;
    pool: CountryPool;
}

export const chronoDurationOptions: ChronoDurationOption[] = [
    { minutes: 3, label: '3 minutes' },
    { minutes: 5, label: '5 minutes' },
    { minutes: 10, label: '10 minutes' },
    { minutes: 15, label: '15 minutes' },
];

export const chronoDurationMinutes = chronoDurationOptions.map((option) => option.minutes);

export const blindPoolOptions: BlindPoolOption[] = [
    {
        id: 'tous',
        label: '259 drapeaux',
        description: 'Tous les drapeaux du jeu, sans indice visuel.',
        pool: 'all',
    },
    {
        id: 'pays',
        label: '197 pays',
        description: 'Liste fixe des 197 pays du jeu.',
        pool: 'sovereign',
    },
];

export const flagQuizModes: FlagQuizMode[] = [
    {
        id: 'tous',
        title: '259 drapeaux',
        description: 'Retrouvez les 259 drapeaux du jeu. Terminez quand vous voulez.',
        href: '/jeux/flag-quiz/tous',
        icon: 'bi-flag-fill',
        pool: 'all',
        endOnComplete: true,
    },
    {
        id: 'chrono',
        title: 'Contre-la-montre',
        description: 'Trouvez un maximum de drapeaux avant la fin du timer.',
        href: '/jeux/flag-quiz/chrono',
        icon: 'bi-stopwatch-fill',
        pool: 'all',
        endOnComplete: false,
    },
    {
        id: 'pays',
        title: '197 pays',
        description: 'Liste fixe des 197 pays du jeu.',
        href: '/jeux/flag-quiz/pays',
        icon: 'bi-geo-alt-fill',
        pool: 'sovereign',
        endOnComplete: true,
    },
    {
        id: 'aveugle',
        title: 'Saisie à l\'aveugle',
        description: 'Aucun drapeau visible : trouvez toute la liste sans aide.',
        href: '/jeux/flag-quiz/aveugle',
        icon: 'bi-eye-slash-fill',
        pool: 'all',
        hideVisual: true,
        freeEntry: true,
        endOnComplete: true,
    },
];

export function getFlagQuizMode(modeId: string | null | undefined): FlagQuizMode | null {
    return flagQuizModes.find((mode) => mode.id === modeId) ?? null;
}

function buildFlagChronoMode(minutes: number): FlagQuizMode | null {
    if (!Number.isInteger(minutes) || !chronoDurationMinutes.includes(minutes)) {
        return null;
    }

    const mode = getFlagQuizMode('chrono');

    if (!mode) {
        return null;
    }

    return {
        ...mode,
        timeLimitMs: minutes * 60 * 1000,
        title: `Contre-la-montre · ${minutes} min`,
    };
}

function buildFlagBlindMode(poolId: string): FlagQuizMode | null {
    const poolOption = blindPoolOptions.find((option) => option.id === poolId);

    if (!poolOption) {
        return null;
    }

    const mode = getFlagQuizMode('aveugle');

    if (!mode) {
        return null;
    }

    return {
        ...mode,
        pool: poolOption.pool,
        hideVisual: true,
        freeEntry: true,
        title: `Saisie à l'aveugle · ${poolOption.label}`,
    };
}

export function getFlagQuizScoreKeyFromPath(pathname: string): string | null {
    const parts = pathSegments(pathname);

    if (!isGamePath(pathname, 'flag-quiz')) {
        return null;
    }

    switch (parts.length) {
        case 3:
            switch (parts[2]) {
                case 'tous':
                case 'pays':
                    return parts[2];
                default:
                    return null;
            }
        case 4:
            switch (parts[2]) {
                case 'chrono': {
                    const minutes = Number(parts[3]);

                    if (!Number.isInteger(minutes) || !chronoDurationMinutes.includes(minutes)) {
                        return null;
                    }

                    return `chrono:${minutes}`;
                }
                case 'aveugle':
                    switch (parts[3]) {
                        case 'tous':
                        case 'pays':
                            return `aveugle:${parts[3]}`;
                        default:
                            return null;
                    }
                default:
                    return null;
            }
        default:
            return null;
    }
}

export function getFlagQuizModeFromPath(pathname: string): FlagQuizMode | null {
    const parts = pathSegments(pathname);

    if (!isGamePath(pathname, 'flag-quiz')) {
        return null;
    }

    switch (parts.length) {
        case 3:
            switch (parts[2]) {
                case 'tous':
                case 'pays':
                    return getFlagQuizMode(parts[2]);
                default:
                    return null;
            }
        case 4:
            switch (parts[2]) {
                case 'chrono':
                    return buildFlagChronoMode(Number(parts[3]));
                case 'aveugle':
                    return buildFlagBlindMode(parts[3]);
                default:
                    return null;
            }
        default:
            return null;
    }
}
