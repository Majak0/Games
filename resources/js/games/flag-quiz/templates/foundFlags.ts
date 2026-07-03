import { fillTemplate } from '@/games/shared/fillTemplate';
import type { Country } from '@/types/country';
import foundFlagThumbHtml from './html/foundFlagThumb.html?raw';
import foundFlagCardHtml from './html/foundFlagCard.html?raw';
import foundFlagsGridHtml from './html/foundFlagsGrid.html?raw';

export function renderFoundFlagsBarTemplate(countries: Country[]): string {
    return countries
        .map((country) =>
            fillTemplate(foundFlagThumbHtml, {
                name: country.name,
                flagUrl: country.flagUrl,
            })
        )
        .join('');
}

export function renderFoundFlagsGridTemplate(countries: Country[]): string {
    const items = countries
        .map((country) =>
            fillTemplate(foundFlagCardHtml, {
                name: country.name,
                flagUrl: country.flagUrl,
            })
        )
        .join('');

    return fillTemplate(foundFlagsGridHtml, { items }, ['items']);
}
