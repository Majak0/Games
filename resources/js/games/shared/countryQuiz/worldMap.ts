import worldMap from '@svg-maps/world';

interface MapLocation {
    id: string;
    path: string;
}

export interface WorldMapRenderOptions {
    quizIsoCodes: Set<string>;
    foundIsoCodes: Set<string>;
    territoryParents: Record<string, string>;
}

let territoryParents: Record<string, string> = {};

export function configureWorldMapTerritories(parents: Record<string, string>): void {
    territoryParents = parents;
}

function isPathFound(isoCode: string, foundIsoCodes: Set<string>, parents: Record<string, string>): boolean {
    if (foundIsoCodes.has(isoCode)) {
        return true;
    }

    const parent = parents[isoCode];

    return parent ? foundIsoCodes.has(parent) : false;
}

function isPathInQuiz(isoCode: string, quizIsoCodes: Set<string>, parents: Record<string, string>): boolean {
    if (quizIsoCodes.has(isoCode)) {
        return true;
    }

    const parent = parents[isoCode];

    return parent ? quizIsoCodes.has(parent) : false;
}

function getCountryPathClass(
    isoCode: string,
    quizIsoCodes: Set<string>,
    foundIsoCodes: Set<string>,
    parents: Record<string, string>
): string {
    if (isPathFound(isoCode, foundIsoCodes, parents)) {
        return 'arcade-world-map__country arcade-world-map__country--found';
    }

    if (isPathInQuiz(isoCode, quizIsoCodes, parents)) {
        return 'arcade-world-map__country arcade-world-map__country--pool';
    }

    return 'arcade-world-map__country arcade-world-map__country--background';
}

function highlightPath(isoCode: string): void {
    const path = document.getElementById(`map-country-${isoCode}`);

    if (!path) {
        return;
    }

    path.classList.remove('arcade-world-map__country--pool');
    path.classList.add('arcade-world-map__country--found');
}

export function renderWorldMapSvg({ quizIsoCodes, foundIsoCodes, territoryParents: parents }: WorldMapRenderOptions): string {
    const paths = worldMap.locations
        .map((location: MapLocation) => {
            const className = getCountryPathClass(location.id, quizIsoCodes, foundIsoCodes, parents);

            return `<path id="map-country-${location.id}" class="${className}" data-iso="${location.id}" d="${location.path}" />`;
        })
        .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${worldMap.viewBox}" class="arcade-world-map" role="img" aria-label="Carte du monde">${paths}</svg>`;
}

export function highlightCountryOnMap(isoCode: string): void {
    highlightPath(isoCode);

    for (const [territoryIso, parentIso] of Object.entries(territoryParents)) {
        if (parentIso === isoCode) {
            highlightPath(territoryIso);
        }
    }
}
