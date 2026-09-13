import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { logoQuizModes } from './modes';
import modeMenuHtml from './templates/html/modeMenu.html?raw';
import modeCardHtml from './templates/html/modeCard.html?raw';

export function initLogoQuizSubmenu(root: HTMLElement): void {
    const modes = logoQuizModes
        .map((mode) => fillTemplate(modeCardHtml, {
            href: mode.href,
            icon: mode.icon,
            title: mode.title,
            description: mode.id === 'chrono'
                ? 'Choisissez une durée : 3, 5, 10 ou 15 minutes.'
                : mode.id === 'categories'
                    ? 'Choisissez un secteur : nourriture, informatique, vêtements…'
                    : mode.description,
            badge: mode.id === 'chrono' ? 'Chrono' : mode.id === 'categories' ? 'Choisir' : 'Jouer',
        }))
        .join('');

    mountTemplate(root, fillTemplate(modeMenuHtml, { modes }, ['modes']));
}
