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

export function isFlagQuizSubmenuPath(pathname: string): boolean {
    return pathname === '/jeux/flag-quiz' || pathname === '/jeux/flag-quiz/';
}

export function isChronoSetupPath(pathname: string): boolean {
    return pathname === '/jeux/flag-quiz/chrono' || pathname === '/jeux/flag-quiz/chrono/';
}

export function isBlindSetupPath(pathname: string): boolean {
    return pathname === '/jeux/flag-quiz/aveugle' || pathname === '/jeux/flag-quiz/aveugle/';
}

export function getFlagQuizModeFromPath(pathname: string): FlagQuizMode | null {
    const chronoMatch = pathname.match(/^\/jeux\/flag-quiz\/chrono\/(\d+)$/);

    if (chronoMatch) {
        const minutes = Number(chronoMatch[1]);

        if (!chronoDurationMinutes.includes(minutes)) {
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

    const blindMatch = pathname.match(/^\/jeux\/flag-quiz\/aveugle\/(tous|pays)$/);

    if (blindMatch) {
        const poolOption = blindPoolOptions.find((option) => option.id === blindMatch[1]);

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

    const match = pathname.match(/^\/jeux\/flag-quiz\/(tous|pays)$/);

    if (!match) {
        return null;
    }

    return getFlagQuizMode(match[1]);
}
