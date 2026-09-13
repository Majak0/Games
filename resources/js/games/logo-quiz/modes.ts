import { isGamePath, pathSegments } from '@/shared/path';

export type LogoVisualStyle = 'flou' | 'nb' | 'color';

export type LogoQuizModeId = 'flou' | 'nb' | 'categories' | 'chrono';

export interface LogoQuizMode {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: string;
    style: LogoVisualStyle;
    category?: string;
    timeLimitMs?: number;
    endOnComplete: boolean;
    imageClass: string;
    imageAlt: string;
}

export interface ChronoDurationOption {
    minutes: number;
    label: string;
    description: string;
}

export const chronoDurationOptions: ChronoDurationOption[] = [
    { minutes: 3, label: '3 minutes', description: 'Trouvez un maximum de logos.' },
    { minutes: 5, label: '5 minutes', description: 'Trouvez un maximum de logos.' },
    { minutes: 10, label: '10 minutes', description: 'Trouvez un maximum de logos.' },
    { minutes: 15, label: '15 minutes', description: 'Trouvez un maximum de logos.' },
];

export const chronoDurationMinutes = chronoDurationOptions.map((option) => option.minutes);

export const logoCategoryLabels: Record<string, string> = {
    nourriture: 'Nourriture',
    informatique: 'Informatique',
    vetements: 'Vêtements',
    automobile: 'Automobile',
    'reseaux-sociaux': 'Réseaux sociaux',
    streaming: 'Streaming',
    finance: 'Finance',
    commerce: 'Commerce',
};

function visualMeta(style: LogoVisualStyle): Pick<LogoQuizMode, 'imageClass' | 'imageAlt'> {
    if (style === 'flou') {
        return {
            imageClass: 'arcade-logo-frame__image--flou',
            imageAlt: 'Logo flouté à reconnaître',
        };
    }

    if (style === 'nb') {
        return {
            imageClass: 'arcade-logo-frame__image--nb',
            imageAlt: 'Logo en noir et blanc à reconnaître',
        };
    }

    return {
        imageClass: 'arcade-logo-frame__image--color',
        imageAlt: 'Logo à reconnaître',
    };
}

export const logoQuizModes: LogoQuizMode[] = [
    {
        id: 'flou',
        title: 'Logos floutés',
        description: 'Les logos restent en couleur, mais un flou les cache.',
        href: '/jeux/logo-quiz/flou',
        icon: 'bi-droplet-half',
        style: 'flou',
        endOnComplete: true,
        ...visualMeta('flou'),
    },
    {
        id: 'nb',
        title: 'Noir et blanc',
        description: 'Les logos sont nets, uniquement en noir et blanc.',
        href: '/jeux/logo-quiz/nb',
        icon: 'bi-circle-half',
        style: 'nb',
        endOnComplete: true,
        ...visualMeta('nb'),
    },
    {
        id: 'categories',
        title: 'Catégories',
        description: 'Jouez uniquement avec un secteur : nourriture, informatique, vêtements…',
        href: '/jeux/logo-quiz/categories',
        icon: 'bi-tags-fill',
        style: 'color',
        endOnComplete: true,
        ...visualMeta('color'),
    },
    {
        id: 'chrono',
        title: 'Contre-la-montre',
        description: 'Trouvez un maximum de logos floutés avant la fin du timer.',
        href: '/jeux/logo-quiz/chrono',
        icon: 'bi-stopwatch-fill',
        style: 'flou',
        endOnComplete: false,
        ...visualMeta('flou'),
    },
];

export function getLogoQuizMode(modeId: string | null | undefined): LogoQuizMode | null {
    return logoQuizModes.find((mode) => mode.id === modeId) ?? null;
}

function buildLogoChronoMode(minutes: number): LogoQuizMode | null {
    if (!Number.isInteger(minutes) || !chronoDurationMinutes.includes(minutes)) {
        return null;
    }

    const mode = getLogoQuizMode('chrono');

    if (!mode) {
        return null;
    }

    return {
        ...mode,
        timeLimitMs: minutes * 60 * 1000,
        title: `Contre-la-montre · ${minutes} min`,
    };
}

export function buildLogoCategoryMode(category: string): LogoQuizMode | null {
    const label = logoCategoryLabels[category];

    if (!label) {
        return null;
    }

    return {
        id: `category:${category}`,
        title: label,
        description: `Retrouvez les marques de la catégorie « ${label} ».`,
        href: `/jeux/logo-quiz/categories/${category}`,
        icon: 'bi-tags-fill',
        style: 'color',
        category,
        endOnComplete: true,
        ...visualMeta('color'),
    };
}

export function getLogoQuizScoreKeyFromPath(pathname: string): string | null {
    const parts = pathSegments(pathname);

    if (!isGamePath(pathname, 'logo-quiz')) {
        return null;
    }

    switch (parts.length) {
        case 3:
            if (parts[2] === 'flou' || parts[2] === 'tous') {
                return 'flou';
            }

            return parts[2] === 'nb' ? 'nb' : null;
        case 4: {
            if (parts[2] === 'chrono') {
                const minutes = Number(parts[3]);

                if (!Number.isInteger(minutes) || !chronoDurationMinutes.includes(minutes)) {
                    return null;
                }

                return `chrono:${minutes}`;
            }

            if (parts[2] === 'categories' && logoCategoryLabels[parts[3]]) {
                return `category:${parts[3]}`;
            }

            return null;
        }
        default:
            return null;
    }
}

export function getLogoQuizModeFromPath(pathname: string): LogoQuizMode | null {
    const parts = pathSegments(pathname);

    if (!isGamePath(pathname, 'logo-quiz')) {
        return null;
    }

    switch (parts.length) {
        case 3:
            if (parts[2] === 'flou' || parts[2] === 'tous') {
                return getLogoQuizMode('flou');
            }

            return parts[2] === 'nb' ? getLogoQuizMode('nb') : null;
        case 4:
            if (parts[2] === 'chrono') {
                return buildLogoChronoMode(Number(parts[3]));
            }

            return parts[2] === 'categories' ? buildLogoCategoryMode(parts[3]) : null;
        default:
            return null;
    }
}
