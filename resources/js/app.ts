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
import {
    isBlackjackPath,
    isHasardSubmenuPath,
    isPileOuFacePath,
} from '@/games/hasard/modes';
import { initHasardSubmenu } from '@/games/hasard/submenu';
import { initPileOuFace } from '@/games/hasard/pile-ou-face';
import { initBlackjack } from '@/games/hasard/blackjack';
import { initLoginPage } from '@/account/initLogin';
import { initRegisterPage } from '@/account/initRegister';
import { initProfilePage } from '@/account/initProfile';
import { initLeaderboardPage } from '@/account/initLeaderboard';
import { initAccountFab } from '@/shared/accountFab';

document.addEventListener('DOMContentLoaded', async () => {
    await initAccountFab();

    const root = document.getElementById('app');

    if (!root) {
        return;
    }

    const { pathname } = window.location;

    if (pathname === '/compte/connexion' || pathname === '/compte/connexion/') {
        initLoginPage(root);
        return;
    }

    if (pathname === '/compte/inscription' || pathname === '/compte/inscription/') {
        initRegisterPage(root);
        return;
    }

    if (pathname === '/compte' || pathname === '/compte/') {
        await initProfilePage(root);
        return;
    }

    const leaderboardMatch = pathname.match(/^\/classement\/(flag-quiz|shape-quiz)\/([a-z0-9:]+)\/?$/);

    if (leaderboardMatch) {
        await initLeaderboardPage(root, leaderboardMatch[1], leaderboardMatch[2]);
        return;
    }

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

    if (isHasardSubmenuPath(pathname)) {
        initHasardSubmenu(root);
        return;
    }

    if (isPileOuFacePath(pathname)) {
        initPileOuFace(root);
        return;
    }

    if (isBlackjackPath(pathname)) {
        initBlackjack(root);
        return;
    }

    initHomeMenu(root);
});
