import worldMap from '@svg-maps/world';

interface MapLocation {
    id: string;
    path: string;
}

export interface WorldMapRenderOptions {
    poolIsoCodes: Set<string>;
    foundIsoCodes: Set<string>;
}

function getCountryPathClass(isoCode: string, poolIsoCodes: Set<string>, foundIsoCodes: Set<string>): string {
    if (foundIsoCodes.has(isoCode)) {
        return 'arcade-world-map__country arcade-world-map__country--found';
    }

    if (poolIsoCodes.has(isoCode)) {
        return 'arcade-world-map__country arcade-world-map__country--pool';
    }

    return 'arcade-world-map__country arcade-world-map__country--background';
}

export function renderWorldMapSvg({ poolIsoCodes, foundIsoCodes }: WorldMapRenderOptions): string {
    const paths = worldMap.locations
        .map((location: MapLocation) => {
            const className = getCountryPathClass(location.id, poolIsoCodes, foundIsoCodes);

            return `<path id="map-country-${location.id}" class="${className}" data-iso="${location.id}" d="${location.path}" />`;
        })
        .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${worldMap.viewBox}" class="arcade-world-map" role="img" aria-label="Carte du monde">${paths}</svg>`;
}

export function highlightCountryOnMap(isoCode: string): void {
    const path = document.getElementById(`map-country-${isoCode}`);

    if (!path) {
        return;
    }

    path.classList.remove('arcade-world-map__country--pool');
    path.classList.add('arcade-world-map__country--found');
}
