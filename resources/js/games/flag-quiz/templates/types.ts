import type { Country } from '@/types/country';

export interface EmptyStateTemplateProps {
    message: string;
}

export interface GameScreenTemplateProps {
    remainingCount: number;
    scoreLabel: string;
    flagUrl: string;
    flagAlt?: string;
    modeLabel: string;
    inputPlaceholder: string;
    hideFlag?: boolean;
}

export interface EndScreenTemplateProps {
    badge: string;
    heading: string;
    scoreSummary: string;
    foundCountries: Country[];
}

export type FlagQuizTemplateProps = {
    emptyState: EmptyStateTemplateProps;
    game: GameScreenTemplateProps;
    end: EndScreenTemplateProps;
};

export type FlagQuizTemplateName = keyof FlagQuizTemplateProps;
