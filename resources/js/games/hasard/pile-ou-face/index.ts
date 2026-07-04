import { mountTemplate } from '@/games/shared/template';
import {
    fetchSavedBestStreak,
    saveBestStreakIfImproved,
} from '@/scores/saveBestStreak';
import gameScreenHtml from './templates/html/gameScreen.html?raw';

type CoinSide = 'heads' | 'tails';

const FLIP_DURATION_MS = 1600;

interface CoinFlipState {
    wins: number;
    losses: number;
    streak: number;
    bestStreak: number;
    savedBestStreak: number;
    flipping: boolean;
    rotationDeg: number;
}

function flipCoin(): CoinSide {
    return Math.random() < 0.5 ? 'heads' : 'tails';
}

function sideLabel(side: CoinSide): string {
    return side === 'heads' ? 'Pile' : 'Face';
}

function computeSpinEnd(currentDeg: number, outcome: CoinSide): number {
    const minSpins = 5 + Math.floor(Math.random() * 3);
    const targetMod = outcome === 'heads' ? 0 : 180;
    const currentMod = ((currentDeg % 360) + 360) % 360;

    let additional = targetMod - currentMod;

    if (additional <= 0) {
        additional += 360;
    }

    return currentDeg + minSpins * 360 + additional;
}

function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initPileOuFace(root: HTMLElement): void {
    mountTemplate(root, gameScreenHtml);

    const coin = root.querySelector<HTMLElement>('#coin');
    const launcher = root.querySelector<HTMLElement>('#coin-launcher');
    const shadow = root.querySelector<HTMLElement>('#coin-shadow');
    const resultEl = root.querySelector<HTMLElement>('#result');
    const winsEl = root.querySelector<HTMLElement>('#wins');
    const lossesEl = root.querySelector<HTMLElement>('#losses');
    const bestStreakEl = root.querySelector<HTMLElement>('#best-streak');
    const choiceButtons = root.querySelectorAll<HTMLButtonElement>('[data-choice]');

    if (!coin || !launcher || !shadow || !resultEl || !winsEl || !lossesEl || !bestStreakEl) {
        return;
    }

    const state: CoinFlipState = {
        wins: 0,
        losses: 0,
        streak: 0,
        bestStreak: 0,
        savedBestStreak: 0,
        flipping: false,
        rotationDeg: 0,
    };

    function applyRotation(degrees: number): void {
        state.rotationDeg = degrees;
        coin.style.setProperty('--coin-rotation', `${degrees}deg`);
        coin.style.transform = `rotateX(${degrees}deg)`;
    }

    function updateStats(): void {
        winsEl.textContent = String(state.wins);
        lossesEl.textContent = String(state.losses);
        bestStreakEl.textContent = String(state.bestStreak);
    }

    async function persistBestStreak(): Promise<void> {
        state.savedBestStreak = await saveBestStreakIfImproved(
            'pile-ou-face',
            state.bestStreak,
            state.savedBestStreak
        );
    }

    function setChoicesEnabled(enabled: boolean): void {
        choiceButtons.forEach((button) => {
            button.disabled = !enabled;
        });
    }

    function finishFlip(playerChoice: CoinSide, outcome: CoinSide, endRotation: number): void {
        applyRotation(endRotation);

        coin.classList.remove('arcade-coin--spinning');
        launcher.classList.remove('arcade-coin-launcher--toss');
        shadow.classList.remove('arcade-coin-shadow--toss');

        const won = playerChoice === outcome;

        if (won) {
            state.wins += 1;
            state.streak += 1;
            state.bestStreak = Math.max(state.bestStreak, state.streak);
            resultEl.textContent = `Gagné ! La pièce est tombée sur ${sideLabel(outcome)}.`;
            resultEl.className = 'arcade-coin-result arcade-coin-result--win';
            void persistBestStreak();
        } else {
            state.losses += 1;
            state.streak = 0;
            resultEl.textContent = `Perdu… La pièce est tombée sur ${sideLabel(outcome)}.`;
            resultEl.className = 'arcade-coin-result arcade-coin-result--lose';
        }

        resultEl.hidden = false;
        updateStats();
        state.flipping = false;
        setChoicesEnabled(true);
    }

    function playFlip(playerChoice: CoinSide, outcome: CoinSide): void {
        state.flipping = true;
        setChoicesEnabled(false);
        resultEl.hidden = true;

        const endRotation = computeSpinEnd(state.rotationDeg, outcome);

        if (prefersReducedMotion()) {
            finishFlip(playerChoice, outcome, endRotation);
            return;
        }

        coin.style.setProperty('--coin-spin-start', `${state.rotationDeg}deg`);
        coin.style.setProperty('--coin-spin-end', `${endRotation}deg`);

        coin.classList.remove('arcade-coin--spinning');
        launcher.classList.remove('arcade-coin-launcher--toss');
        shadow.classList.remove('arcade-coin-shadow--toss');
        void coin.offsetWidth;

        coin.classList.add('arcade-coin--spinning');
        launcher.classList.add('arcade-coin-launcher--toss');
        shadow.classList.add('arcade-coin-shadow--toss');

        window.setTimeout(() => {
            finishFlip(playerChoice, outcome, endRotation);
        }, FLIP_DURATION_MS);
    }

    choiceButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (state.flipping) {
                return;
            }

            const choice = button.dataset.choice as CoinSide | undefined;

            if (choice !== 'heads' && choice !== 'tails') {
                return;
            }

            playFlip(choice, flipCoin());
        });
    });

    applyRotation(0);
    updateStats();

    void fetchSavedBestStreak('pile-ou-face').then((saved) => {
        state.savedBestStreak = saved;
        state.bestStreak = Math.max(state.bestStreak, saved);
        updateStats();
    });
}
