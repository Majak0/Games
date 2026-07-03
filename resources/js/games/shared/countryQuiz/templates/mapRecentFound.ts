import { fillTemplate } from '@/games/shared/fillTemplate';
import type { Country } from '@/types/country';
import mapRecentItemHtml from './html/mapRecentItem.html?raw';

export function renderMapRecentFoundList(countries: Country[]): string {
    if (countries.length === 0) {
        return '<li class="arcade-map-recent__empty">Aucun pays trouvé pour l\'instant.</li>';
    }

    return [...countries]
        .reverse()
        .map((country) => fillTemplate(mapRecentItemHtml, { name: country.name }))
        .join('');
}
