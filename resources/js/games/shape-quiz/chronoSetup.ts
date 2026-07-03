import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { chronoDurationOptions } from './modes';
import chronoSetupHtml from './templates/html/chronoSetup.html?raw';
import chronoDurationCardHtml from './templates/html/chronoDurationCard.html?raw';

export function initShapeChronoSetup(root: HTMLElement): void {
    const durations = chronoDurationOptions
        .map((option) =>
            fillTemplate(chronoDurationCardHtml, {
                href: `/jeux/shape-quiz/chrono/${option.minutes}`,
                label: option.label,
                description: option.description,
            })
        )
        .join('');

    mountTemplate(root, fillTemplate(chronoSetupHtml, { durations }, ['durations']));
}
