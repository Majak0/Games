import type { GameScreenTemplateProps } from './types';

const visualFrameHtml = `
<div class="arcade-visual-frame arcade-visual-frame--{{visual}}">
    <img id="quiz-visual" src="{{visualUrl}}" alt="{{visualAlt}}">
</div>`;

export function buildVisualSection(props: GameScreenTemplateProps): string {
    if (props.hideVisual) {
        return '';
    }

    return visualFrameHtml
        .replace('{{visual}}', props.visual)
        .replace('{{visualUrl}}', props.visualUrl)
        .replace('{{visualAlt}}', props.labels.visualAlt);
}
