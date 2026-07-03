import type { GameScreenTemplateProps } from './types';

const flagFrameHtml = `
<div class="arcade-flag-frame">
    <img id="flag-image" src="{{flagUrl}}" alt="{{flagAlt}}">
</div>`;

const blindPromptHtml = `
<div class="arcade-blind-prompt">
    <i class="bi bi-eye-slash-fill"></i>
    <p class="arcade-blind-prompt__title">Aucun drapeau affiché</p>
    <p class="arcade-blind-prompt__text">Tapez un nom de pays : son drapeau apparaîtra ci-dessous une fois trouvé.</p>
</div>`;

export function buildFlagSection(props: GameScreenTemplateProps): string {
    if (props.hideFlag) {
        return blindPromptHtml;
    }

    return flagFrameHtml
        .replace('{{flagUrl}}', props.flagUrl)
        .replace('{{flagAlt}}', props.flagAlt ?? 'Drapeau à deviner');
}
