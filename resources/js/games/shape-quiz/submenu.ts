import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { shapeQuizModes } from './modes';
import modeMenuHtml from './templates/html/modeMenu.html?raw';
import modeCardHtml from './templates/html/modeCard.html?raw';

function renderModeCard(mode: (typeof shapeQuizModes)[number], poolCount: number): string {
    let description = mode.description;

    if (mode.id === 'pays') {
        description = `Retrouvez les ${poolCount} formes de pays. Terminez quand vous voulez.`;
    }

    if (mode.id === 'chrono') {
        description = 'Choisissez une durée : 3, 5, 10 ou 15 minutes.';
    }

    if (mode.id === 'aveugle') {
        description = `${poolCount} pays : aucun indice visuel, saisie libre.`;
    }

    if (mode.id === 'carte') {
        description = `Coloriez les ${poolCount} pays visibles sur la carte du monde.`;
    }

    return fillTemplate(modeCardHtml, {
        href: mode.href,
        icon: mode.icon,
        title: mode.title,
        description,
        badge: mode.id === 'chrono' ? 'Chrono' : mode.id === 'aveugle' ? 'Aveugle' : mode.id === 'carte' ? 'Map' : 'Jouer',
    });
}

export async function initShapeQuizSubmenu(root: HTMLElement): Promise<void> {
    const [mapResponse, sovereignResponse] = await Promise.all([
        fetch('/api/countries?pool=map'),
        fetch('/api/countries?pool=sovereign'),
    ]);

    const mapCountries = await mapResponse.json();
    const sovereignCountries = await sovereignResponse.json();

    mountTemplate(root, fillTemplate(modeMenuHtml, {
        modes: shapeQuizModes
            .map((mode) => {
                const poolCount = mode.pool === 'map'
                    ? mapCountries.length
                    : sovereignCountries.length;

                return renderModeCard(mode, poolCount);
            })
            .join(''),
    }, ['modes']));
}
