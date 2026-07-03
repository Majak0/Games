import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { renderWorldMapSvg } from '../worldMap';
import mapGameScreenHtml from './html/mapGameScreen.html?raw';

export interface MapGameScreenTemplateProps {
    remainingCount: number;
    scoreLabel: string;
    modeLabel: string;
    inputPlaceholder: string;
    poolIsoCodes: Set<string>;
    foundIsoCodes: Set<string>;
    territoryParents: Record<string, string>;
}

export function renderMapGameScreenTemplate(props: MapGameScreenTemplateProps): string {
    return fillTemplate(mapGameScreenHtml, {
        remainingCount: props.remainingCount,
        scoreLabel: props.scoreLabel,
        modeLabel: props.modeLabel,
        inputPlaceholder: props.inputPlaceholder,
        worldMapSvg: renderWorldMapSvg({
            quizIsoCodes: props.poolIsoCodes,
            foundIsoCodes: props.foundIsoCodes,
            territoryParents: props.territoryParents,
        }),
    }, ['worldMapSvg']);
}

export function mountMapGameScreen(root: HTMLElement, props: MapGameScreenTemplateProps): void {
    mountTemplate(root, renderMapGameScreenTemplate(props));
}
