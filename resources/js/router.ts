import { initLeaderboardPage } from '@/account/initLeaderboard';
import { initLoginPage } from '@/account/initLogin';
import { initProfilePage } from '@/account/initProfile';
import { initRegisterPage } from '@/account/initRegister';
import { initContactPage } from '@/contact/initContact';
import { initBlindSetup } from '@/games/flag-quiz/blindSetup';
import { initChronoSetup } from '@/games/flag-quiz/chronoSetup';
import { getFlagQuizModeFromPath } from '@/games/flag-quiz/modes';
import { initFlagQuiz } from '@/games/flag-quiz';
import { initFlagQuizSubmenu } from '@/games/flag-quiz/submenu';
import { initHomeMenu } from '@/games/home/templates';
import { initBlackjack } from '@/games/hasard/blackjack';
import { initPileOuFace } from '@/games/hasard/pile-ou-face';
import { initHasardSubmenu } from '@/games/hasard/submenu';
import { initShapeChronoSetup } from '@/games/shape-quiz/chronoSetup';
import { getShapeQuizModeFromPath } from '@/games/shape-quiz/modes';
import { initShapeQuiz } from '@/games/shape-quiz';
import { initShapeQuizSubmenu } from '@/games/shape-quiz/submenu';
import { normalizePath, parseLeaderboardPath } from '@/shared/path';

export async function mountApp(root: HTMLElement): Promise<void> {
    const path = normalizePath(window.location.pathname);

    switch (path) {
        case '/compte/connexion':
            initLoginPage(root);
            return;
        case '/compte/inscription':
            initRegisterPage(root);
            return;
        case '/compte':
            await initProfilePage(root);
            return;
        case '/contact':
            initContactPage(root);
            return;
        case '/jeux/flag-quiz':
            await initFlagQuizSubmenu(root);
            return;
        case '/jeux/flag-quiz/chrono':
            initChronoSetup(root);
            return;
        case '/jeux/flag-quiz/aveugle':
            await initBlindSetup(root);
            return;
        case '/jeux/shape-quiz':
            await initShapeQuizSubmenu(root);
            return;
        case '/jeux/shape-quiz/chrono':
            initShapeChronoSetup(root);
            return;
        case '/jeux/hasard':
            initHasardSubmenu(root);
            return;
        case '/jeux/hasard/pile-ou-face':
            initPileOuFace(root);
            return;
        case '/jeux/hasard/blackjack':
            initBlackjack(root);
            return;
    }

    const leaderboard = parseLeaderboardPath(path);

    if (leaderboard) {
        await initLeaderboardPage(root, leaderboard.game, leaderboard.mode);
        return;
    }

    const shapeMode = getShapeQuizModeFromPath(path);

    if (shapeMode) {
        await initShapeQuiz(root, shapeMode);
        return;
    }

    const flagMode = getFlagQuizModeFromPath(path);

    if (flagMode) {
        await initFlagQuiz(root, flagMode);
        return;
    }

    initHomeMenu(root);
}
