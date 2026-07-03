import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { games } from '../games';
import menuHtml from './html/menu.html?raw';
import gameCardHtml from './html/gameCard.html?raw';

function renderGameCard(game: (typeof games)[number]): string {
    return fillTemplate(gameCardHtml, {
        href: game.available ? game.href : '#',
        cardModifier: game.available ? '' : 'arcade-game-card--disabled',
        icon: game.icon,
        title: game.title,
        description: game.description,
        badge: game.available ? 'Jouer' : 'Bientôt',
    });
}

export function renderHomeMenuTemplate(): string {
    return fillTemplate(menuHtml, {
        games: games.map(renderGameCard).join(''),
    }, ['games']);
}

export function initHomeMenu(root: HTMLElement): void {
    mountTemplate(root, renderHomeMenuTemplate());
}
