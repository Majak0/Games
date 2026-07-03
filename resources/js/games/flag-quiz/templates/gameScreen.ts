import { fillTemplate } from '@/games/shared/fillTemplate';
import type { GameScreenTemplateProps } from './types';
import { buildFlagSection } from './flagSection';
import gameScreenHtml from './html/gameScreen.html?raw';

export function renderGameScreenTemplate(props: GameScreenTemplateProps): string {
    return fillTemplate(gameScreenHtml, {
        remainingCount: props.remainingCount,
        scoreLabel: props.scoreLabel,
        modeLabel: props.modeLabel,
        inputPlaceholder: props.inputPlaceholder,
        flagSection: buildFlagSection(props),
    }, ['flagSection']);
}
