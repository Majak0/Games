import {
    getShapeQuizModeFromPath,
    isShapeChronoSetupPath,
    isShapeQuizSubmenuPath,
} from '@/games/shape-quiz/modes';
import { initShapeQuiz } from '@/games/shape-quiz';
import { initShapeChronoSetup } from '@/games/shape-quiz/chronoSetup';
import { initShapeQuizSubmenu } from '@/games/shape-quiz/submenu';
import { getFlagQuizModeFromPath, isBlindSetupPath, isChronoSetupPath, isFlagQuizSubmenuPath } from '@/games/flag-quiz/modes';
import { initFlagQuiz } from '@/games/flag-quiz';
import { initBlindSetup } from '@/games/flag-quiz/blindSetup';
import { initChronoSetup } from '@/games/flag-quiz/chronoSetup';
import { initFlagQuizSubmenu } from '@/games/flag-quiz/submenu';
import { initHomeMenu } from '@/games/home/templates';

document.addEventListener('DOMContentLoaded', async () => {
    const root = document.getElementById('app');

    if (!root) {
        return;
    }

    const { pathname } = window.location;

    if (isShapeQuizSubmenuPath(pathname)) {
        await initShapeQuizSubmenu(root);
        return;
    }

    if (isShapeChronoSetupPath(pathname)) {
        initShapeChronoSetup(root);
        return;
    }

    const shapeMode = getShapeQuizModeFromPath(pathname);

    if (shapeMode) {
        await initShapeQuiz(root, shapeMode);
        return;
    }

    if (isFlagQuizSubmenuPath(pathname)) {
        await initFlagQuizSubmenu(root);
        return;
    }

    if (isChronoSetupPath(pathname)) {
        initChronoSetup(root);
        return;
    }

    if (isBlindSetupPath(pathname)) {
        await initBlindSetup(root);
        return;
    }

    const mode = getFlagQuizModeFromPath(pathname);

    if (mode) {
        await initFlagQuiz(root, mode);
        return;
    }

    initHomeMenu(root);
});
