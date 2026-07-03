import { fillTemplate } from '@/games/shared/fillTemplate';
import type { Country } from '@/types/country';
import type { CountryQuizVisual } from '../config';
import { getCountryVisualUrl } from '../config';
import foundVisualThumbHtml from './html/foundVisualThumb.html?raw';
import foundVisualCardHtml from './html/foundVisualCard.html?raw';
import foundFlagsGridHtml from './html/foundFlagsGrid.html?raw';

export function renderFoundVisualsBarTemplate(
    countries: Country[],
    visual: CountryQuizVisual
): string {
    return countries
        .map((country) =>
            fillTemplate(foundVisualThumbHtml, {
                name: country.name,
                visualUrl: getCountryVisualUrl(country, visual),
                visual,
            })
        )
        .join('');
}

export function renderFoundVisualsGridTemplate(
    countries: Country[],
    visual: CountryQuizVisual
): string {
    const items = countries
        .map((country) =>
            fillTemplate(foundVisualCardHtml, {
                name: country.name,
                visualUrl: getCountryVisualUrl(country, visual),
                visual,
            })
        )
        .join('');

    return fillTemplate(foundFlagsGridHtml, { items }, ['items']);
}
