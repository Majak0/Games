import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { flagQuizModes } from './modes';
import modeMenuHtml from './templates/html/modeMenu.html?raw';
import modeCardHtml from './templates/html/modeCard.html?raw';

function renderModeCard(
    mode: (typeof flagQuizModes)[number],
    allCount: number,
    sovereignCount: number
): string {
    let description = mode.description;
    let title = mode.title;

    if (mode.id === 'tous') {
        title = `${allCount} drapeaux`;
        description = `Retrouvez les ${allCount} drapeaux du jeu. Terminez quand vous voulez.`;
    }

    if (mode.id === 'chrono') {
        description = 'Choisissez une durée : 3, 5, 10 ou 15 minutes.';
    }

    if (mode.id === 'aveugle') {
        description = `Choisissez une liste : ${allCount} drapeaux ou ${sovereignCount} pays.`;
    }

    if (mode.id === 'pays') {
        title = `${sovereignCount} pays`;
        description = `Uniquement les ${sovereignCount} pays sans dépendances ni territoires.`;
    }

    return fillTemplate(modeCardHtml, {
        href: mode.href,
        icon: mode.icon,
        title,
        description,
        badge: mode.id === 'chrono' ? 'Chrono' : mode.id === 'aveugle' ? 'Aveugle' : 'Jouer',
    });
}

export async function initFlagQuizSubmenu(root: HTMLElement): Promise<void> {
    const [allResponse, sovereignResponse] = await Promise.all([
        fetch('/api/countries'),
        fetch('/api/countries?pool=sovereign'),
    ]);

    const allCountries = await allResponse.json();
    const sovereignCountries = await sovereignResponse.json();

    mountTemplate(root, fillTemplate(modeMenuHtml, {
        modes: flagQuizModes
            .map((mode) => renderModeCard(mode, allCountries.length, sovereignCountries.length))
            .join(''),
    }, ['modes']));
}
