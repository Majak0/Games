import { mountTemplate } from '@/games/shared/template';
import { renderEmptyStateTemplate } from './emptyState';
import { renderEndScreenTemplate } from './endScreen';
import { renderGameScreenTemplate } from './gameScreen';
import type { FlagQuizTemplateName, FlagQuizTemplateProps } from './types';

const flagQuizTemplates = {
    emptyState: renderEmptyStateTemplate,
    game: renderGameScreenTemplate,
    end: renderEndScreenTemplate,
} as const;

export function mountFlagQuizTemplate<T extends FlagQuizTemplateName>(
    root: HTMLElement,
    template: T,
    props: FlagQuizTemplateProps[T]
): void {
    mountTemplate(root, flagQuizTemplates[template](props as never));
}

export { renderFoundFlagsBarTemplate } from './foundFlags';
export type { FlagQuizTemplateName, FlagQuizTemplateProps } from './types';
