import type { ShapeQuizMode } from './modes';
import { shapeQuizConfig } from './config';

export async function initShapeQuiz(root: HTMLElement, mode: ShapeQuizMode): Promise<void> {
    if (mode.mapMode) {
        const { initMapQuiz } = await import('@/games/shared/countryQuiz/initMapQuiz');
        await initMapQuiz(root, mode, shapeQuizConfig);
        return;
    }

    const { initCountryQuiz } = await import('@/games/shared/countryQuiz/initCountryQuiz');
    await initCountryQuiz(root, mode, shapeQuizConfig);
}
