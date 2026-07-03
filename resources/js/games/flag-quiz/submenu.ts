import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { flagQuizModes } from './modes';
import modeMenuHtml from './templates/html/modeMenu.html?raw';
import modeCardHtml from './templates/html/modeCard.html?raw';

function renderModeCard(mode: (typeof flagQuizModes)[number], poolCount?: number): string {
    let description = mode.description;

    if (mode.id === 'tous') {
        description = `Retrouvez les ${poolCount} drapeaux du jeu. Terminez quand vous voulez.`;
    }

    if (mode.id === 'chrono') {
        description = 'Choisissez une durée : 3, 5, 10 ou 15 minutes.';
    }

    if (mode.id === 'aveugle') {
        description = 'Choisissez une liste : 239 drapeaux ou 159 pays.';
    }

    if (mode.id === 'pays') {
        description = `Uniquement les ${poolCount} pays sans dépendances ni territoires.`;
    }

    return fillTemplate(modeCardHtml, {
        href: mode.href,
        icon: mode.icon,
        title: mode.title,
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
            .map((mode) => {
                const poolCount = mode.pool === 'sovereign'
                    ? sovereignCountries.length
                    : allCountries.length;

                return renderModeCard(mode, poolCount);
            })
            .join(''),
    }, ['modes']));
}
