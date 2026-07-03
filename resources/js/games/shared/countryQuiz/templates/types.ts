import type { Country } from '@/types/country';
import type { CountryQuizLabels, CountryQuizVisual } from '../config';

export interface EmptyStateTemplateProps {
    message: string;
}

export interface GameScreenTemplateProps {
    remainingCount: number;
    scoreLabel: string;
    visualUrl: string;
    modeLabel: string;
    inputPlaceholder: string;
    hideVisual?: boolean;
    strictBlind?: boolean;
    visual: CountryQuizVisual;
    labels: CountryQuizLabels;
}

export interface EndScreenTemplateProps {
    badge: string;
    heading: string;
    scoreSummary: string;
    scoreSaveSection?: string;
    foundCountries: Country[];
    backHref: string;
    visual: CountryQuizVisual;
}

export type CountryQuizTemplateProps = {
    emptyState: EmptyStateTemplateProps;
    game: GameScreenTemplateProps;
    end: EndScreenTemplateProps;
};

export type CountryQuizTemplateName = keyof CountryQuizTemplateProps;
