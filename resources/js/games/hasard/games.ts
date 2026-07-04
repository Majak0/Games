export interface HasardGameDefinition {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: string;
    badge: string;
}

export const hasardGames: HasardGameDefinition[] = [
    {
        id: 'pile-ou-face',
        title: 'Pile ou face',
        description: 'Pariez sur pile ou face et tentez d\'enchaîner les bonnes réponses.',
        href: '/jeux/hasard/pile-ou-face',
        icon: 'bi-coin',
        badge: 'Jouer',
    },
    {
        id: 'blackjack',
        title: 'Blackjack',
        description: 'Affrontez le croupier : approchez 21 sans dépasser.',
        href: '/jeux/hasard/blackjack',
        icon: 'bi-suit-spade-fill',
        badge: 'Jouer',
    },
];
