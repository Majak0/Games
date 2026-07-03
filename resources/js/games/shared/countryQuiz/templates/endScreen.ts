import { fillTemplate } from '@/games/shared/fillTemplate';
import type { EndScreenTemplateProps } from './types';
import { renderFoundVisualsGridTemplate } from './foundVisuals';
import endScreenHtml from './html/endScreen.html?raw';

export function renderEndScreenTemplate({
    badge,
    heading,
    scoreSummary,
    foundCountries,
    backHref,
    visual,
}: EndScreenTemplateProps): string {
    return fillTemplate(endScreenHtml, {
        badge,
        heading,
        scoreSummary,
        backHref,
        foundVisualsGrid: foundCountries.length
            ? renderFoundVisualsGridTemplate(foundCountries, visual)
            : '',
    }, ['foundVisualsGrid']);
}
