import { fillTemplate } from '@/games/shared/fillTemplate';
import type { EndScreenTemplateProps } from './types';
import { renderFoundFlagsGridTemplate } from './foundFlags';
import endScreenHtml from './html/endScreen.html?raw';

export function renderEndScreenTemplate({
    badge,
    heading,
    scoreSummary,
    foundCountries,
}: EndScreenTemplateProps): string {
    return fillTemplate(endScreenHtml, {
        badge,
        heading,
        scoreSummary,
        foundFlagsGrid: foundCountries.length
            ? renderFoundFlagsGridTemplate(foundCountries)
            : '',
    }, ['foundFlagsGrid']);
}
