export interface GameDefinition {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: string;
    available: boolean;
}

export const games: GameDefinition[] = [
    {
        id: 'flag-quiz',
        title: 'Quiz des drapeaux',
        description: 'Devinez le pays à partir de son drapeau et battez votre record.',
        href: '/jeux/flag-quiz',
        icon: 'bi-flag-fill',
        available: true,
    },
    {
        id: 'coming-soon',
        title: 'Prochain jeu',
        description: 'Une nouvelle salle ouvrira bientôt dans l\'arcade.',
        href: '#',
        icon: 'bi-controller',
        available: false,
    },
];

export function getGameFromPath(pathname: string): string | null {
    if (pathname === '/jeux/flag-quiz' || pathname.startsWith('/jeux/flag-quiz/')) {
        return 'flag-quiz';
    }

    return null;
}
