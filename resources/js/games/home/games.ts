export interface GameDefinition {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: string;
    available: boolean;
    isCategory?: boolean;
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
        id: 'shape-quiz',
        title: 'Quiz des formes',
        description: 'Reconnaissez les pays à partir de leur silhouette sur la carte.',
        href: '/jeux/shape-quiz',
        icon: 'bi-map-fill',
        available: true,
    },
    {
        id: 'hasard',
        title: 'Jeux de hasard',
        description: 'Pile ou face, blackjack et autres jeux aléatoires.',
        href: '/jeux/hasard',
        icon: 'bi-dice-5-fill',
        available: true,
        isCategory: true,
    },
    {
        id: 'coming-soon',
        title: 'Prochain jeu',
        description: 'Une nouvelle salle ouvrira bientôt dans l\'arcade.',
        href: '#',
        icon: 'bi-controller',
        available: false,
    }
];
