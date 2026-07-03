import { fillTemplate } from '@/games/shared/fillTemplate';
import type { EmptyStateTemplateProps } from './types';
import emptyStateHtml from './html/emptyState.html?raw';

export function renderEmptyStateTemplate({ message }: EmptyStateTemplateProps): string {
    return fillTemplate(emptyStateHtml, { message });
}
