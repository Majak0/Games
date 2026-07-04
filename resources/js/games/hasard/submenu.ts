import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { hasardGames } from './games';
import modeMenuHtml from './templates/html/modeMenu.html?raw';
import modeCardHtml from './templates/html/modeCard.html?raw';

function renderGameCard(game: (typeof hasardGames)[number]): string {
    return fillTemplate(modeCardHtml, {
        href: game.href,
        icon: game.icon,
        title: game.title,
        description: game.description,
        badge: game.badge,
    });
}

export function initHasardSubmenu(root: HTMLElement): void {
    mountTemplate(root, fillTemplate(modeMenuHtml, {
        games: hasardGames.map(renderGameCard).join(''),
    }, ['games']));
}
