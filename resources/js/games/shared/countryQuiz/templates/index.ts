import { mountTemplate } from '@/games/shared/template';
import { renderEmptyStateTemplate } from './emptyState';
import { renderEndScreenTemplate } from './endScreen';
import { renderGameScreenTemplate } from './gameScreen';
import type { CountryQuizTemplateName, CountryQuizTemplateProps } from './types';

const countryQuizTemplates = {
    emptyState: renderEmptyStateTemplate,
    game: renderGameScreenTemplate,
    end: renderEndScreenTemplate,
} as const;

export function mountCountryQuizTemplate<T extends CountryQuizTemplateName>(
    root: HTMLElement,
    template: T,
    props: CountryQuizTemplateProps[T]
): void {
    mountTemplate(root, countryQuizTemplates[template](props as never));
}

export { renderFoundVisualsBarTemplate } from './foundVisuals';
export type { CountryQuizTemplateName, CountryQuizTemplateProps } from './types';
