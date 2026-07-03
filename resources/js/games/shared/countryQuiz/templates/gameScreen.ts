import { fillTemplate } from '@/games/shared/fillTemplate';
import type { GameScreenTemplateProps } from './types';
import { buildVisualSection } from './visualSection';
import gameScreenHtml from './html/gameScreen.html?raw';

const skipButtonHtml = `
            <button id="skip-flag" type="button" class="arcade-btn arcade-btn--skip">
                <i class="bi bi-arrow-counterclockwise"></i> {{skipLabel}}
            </button>`;

const foundFooterSectionHtml = `
    <footer class="arcade-footer shrink-0 px-4 py-3">
        <p class="text-xs text-neon-green mb-2 uppercase tracking-widest">{{foundFooterLabel}}</p>
        <div id="found-list" class="arcade-found-list flex flex-wrap gap-1.5"></div>
    </footer>`;

export function renderGameScreenTemplate(props: GameScreenTemplateProps): string {
    const strictBlind = props.strictBlind ?? false;

    return fillTemplate(gameScreenHtml, {
        remainingCount: props.remainingCount,
        scoreLabel: props.scoreLabel,
        modeLabel: props.modeLabel,
        inputPlaceholder: props.inputPlaceholder,
        skipButton: strictBlind
            ? ''
            : fillTemplate(skipButtonHtml, { skipLabel: props.labels.skipButton }),
        foundFooterSection: strictBlind
            ? ''
            : fillTemplate(foundFooterSectionHtml, { foundFooterLabel: props.labels.foundFooter }),
        visualSection: buildVisualSection(props),
    }, ['visualSection', 'skipButton', 'foundFooterSection']);
}
