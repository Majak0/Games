export type CountryQuizVisual = 'flag' | 'shape';

export interface CountryQuizLabels {
    emptyMessage: string;
    endCompleteHeading: string;
    skipButton: string;
    foundFooter: string;
    visualAlt: string;
    blindTitle: string;
    blindText: string;
    correctFreeEntry: string;
    correctNormal: string;
    scoreUnitSingular: string;
    scoreUnitPlural: string;
}

export interface CountryQuizGameConfig {
    visual: CountryQuizVisual;
    backHref: string;
    labels: CountryQuizLabels;
}

export interface CountryQuizMode {
    title: string;
    pool: 'all' | 'sovereign' | 'map';
    timeLimitMs?: number;
    hideVisual?: boolean;
    freeEntry?: boolean;
    endOnComplete: boolean;
}

export function getCountryVisualUrl(
    country: { flagUrl: string; shapeUrl?: string },
    visual: CountryQuizVisual
): string {
    return visual === 'shape' ? (country.shapeUrl ?? '') : country.flagUrl;
}
