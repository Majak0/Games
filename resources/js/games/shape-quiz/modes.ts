import { isGamePath, pathSegments } from '@/shared/path';

export type ShapeQuizModeId = 'pays' | 'chrono' | 'aveugle' | 'carte';

export interface ShapeQuizMode {
    id: ShapeQuizModeId;
    title: string;
    description: string;
    href: string;
    icon: string;
    pool: 'sovereign' | 'map' | 'world';
    timeLimitMs?: number;
    hideVisual?: boolean;
    freeEntry?: boolean;
    mapMode?: boolean;
    endOnComplete: boolean;
}

export const shapeQuizModes: ShapeQuizMode[] = [
    {
        id: 'carte',
        title: 'Complète la map',
        description: 'Coloriez la carte en trouvant les 197 pays du monde.',
        href: '/jeux/shape-quiz/carte',
        icon: 'bi-globe-americas',
        pool: 'world',
        mapMode: true,
        freeEntry: true,
        endOnComplete: true,
    },
    {
        id: 'pays',
        title: '197 pays',
        description: 'Retrouvez les 197 formes de pays. Terminez quand vous voulez.',
        href: '/jeux/shape-quiz/pays',
        icon: 'bi-map-fill',
        pool: 'sovereign',
        endOnComplete: true,
    },
    {
        id: 'chrono',
        title: 'Contre-la-montre',
        description: 'Trouvez un maximum de pays avant la fin du timer.',
        href: '/jeux/shape-quiz/chrono',
        icon: 'bi-stopwatch-fill',
        pool: 'sovereign',
        endOnComplete: false,
    },
    {
        id: 'aveugle',
        title: 'Saisie à l\'aveugle',
        description: 'Aucune forme visible : trouvez toute la liste sans aide.',
        href: '/jeux/shape-quiz/aveugle',
        icon: 'bi-eye-slash-fill',
        pool: 'sovereign',
        hideVisual: true,
        freeEntry: true,
        endOnComplete: true,
    },
];

export const chronoDurationOptions = [
    { minutes: 3, label: '3 minutes' },
    { minutes: 5, label: '5 minutes' },
    { minutes: 10, label: '10 minutes' },
    { minutes: 15, label: '15 minutes' },
] as const;

export const chronoDurationMinutes = chronoDurationOptions.map((option) => option.minutes);

export function getShapeQuizMode(modeId: string | null | undefined): ShapeQuizMode | null {
    return shapeQuizModes.find((mode) => mode.id === modeId) ?? null;
}

function buildShapeChronoMode(minutes: number): ShapeQuizMode | null {
    if (!Number.isInteger(minutes) || !(chronoDurationMinutes as readonly number[]).includes(minutes)) {
        return null;
    }

    const mode = getShapeQuizMode('chrono');

    if (!mode) {
        return null;
    }

    return {
        ...mode,
        timeLimitMs: minutes * 60 * 1000,
        title: `Contre-la-montre · ${minutes} min`,
    };
}

export function getShapeQuizScoreKeyFromPath(pathname: string): string | null {
    const parts = pathSegments(pathname);

    if (!isGamePath(pathname, 'shape-quiz')) {
        return null;
    }

    switch (parts.length) {
        case 3:
            switch (parts[2]) {
                case 'pays':
                case 'aveugle':
                case 'carte':
                    return parts[2];
                default:
                    return null;
            }
        case 4:
            switch (parts[2]) {
                case 'chrono': {
                    const minutes = Number(parts[3]);

                    if (!Number.isInteger(minutes) || !(chronoDurationMinutes as readonly number[]).includes(minutes)) {
                        return null;
                    }

                    return `chrono:${minutes}`;
                }
                default:
                    return null;
            }
        default:
            return null;
    }
}

export function getShapeQuizModeFromPath(pathname: string): ShapeQuizMode | null {
    const parts = pathSegments(pathname);

    if (!isGamePath(pathname, 'shape-quiz')) {
        return null;
    }

    switch (parts.length) {
        case 3:
            switch (parts[2]) {
                case 'pays':
                case 'aveugle':
                case 'carte':
                    return getShapeQuizMode(parts[2]);
                default:
                    return null;
            }
        case 4:
            switch (parts[2]) {
                case 'chrono':
                    return buildShapeChronoMode(Number(parts[3]));
                default:
                    return null;
            }
        default:
            return null;
    }
}
