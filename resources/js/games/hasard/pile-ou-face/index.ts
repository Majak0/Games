import { mountTemplate } from '@/games/shared/template';
import { createStreakTracker } from '@/games/hasard/streakTracker';
import { bindElements } from '@/shared/bindElements';
import gameScreenHtml from './templates/html/gameScreen.html?raw';

type CoinSide = 'heads' | 'tails';

const FLIP_DURATION_MS = 1600;

interface CoinFlipState {
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

    const elements = bindElements(root, {
        coin: '#coin',
        launcher: '#coin-launcher',
        shadow: '#coin-shadow',
        result: '#result',
        wins: '#wins',
        losses: '#losses',
        bestStreak: '#best-streak',
    });

    if (!elements) {
        return;
    }

    const choiceButtons = root.querySelectorAll<HTMLButtonElement>('[data-choice]');
    const streak = createStreakTracker('pile-ou-face', {
        wins: elements.wins,
        losses: elements.losses,
        bestStreak: elements.bestStreak,
    });

    const state: CoinFlipState = {
        flipping: false,
        rotationDeg: 0,
    };

    function applyRotation(degrees: number): void {
        state.rotationDeg = degrees;
        elements.coin.style.setProperty('--coin-rotation', `${degrees}deg`);
        elements.coin.style.transform = `rotateX(${degrees}deg)`;
    }

    function setChoicesEnabled(enabled: boolean): void {
        choiceButtons.forEach((button) => {
            button.disabled = !enabled;
        });
    }

    function finishFlip(playerChoice: CoinSide, outcome: CoinSide, endRotation: number): void {
        applyRotation(endRotation);

        elements.coin.classList.remove('arcade-coin--spinning');
        elements.launcher.classList.remove('arcade-coin-launcher--toss');
        elements.shadow.classList.remove('arcade-coin-shadow--toss');

        const won = playerChoice === outcome;

        if (won) {
            streak.recordWin();
            elements.result.textContent = `Gagné ! La pièce est tombée sur ${sideLabel(outcome)}.`;
            elements.result.className = 'arcade-coin-result arcade-coin-result--win';
        } else {
            streak.recordLoss();
            elements.result.textContent = `Perdu… La pièce est tombée sur ${sideLabel(outcome)}.`;
            elements.result.className = 'arcade-coin-result arcade-coin-result--lose';
        }

        elements.result.hidden = false;
        state.flipping = false;
        setChoicesEnabled(true);
    }

    function playFlip(playerChoice: CoinSide, outcome: CoinSide): void {
        state.flipping = true;
        setChoicesEnabled(false);
        elements.result.hidden = true;

        const endRotation = computeSpinEnd(state.rotationDeg, outcome);

        if (prefersReducedMotion()) {
            finishFlip(playerChoice, outcome, endRotation);
            return;
        }

        elements.coin.style.setProperty('--coin-spin-start', `${state.rotationDeg}deg`);
        elements.coin.style.setProperty('--coin-spin-end', `${endRotation}deg`);

        elements.coin.classList.remove('arcade-coin--spinning');
        elements.launcher.classList.remove('arcade-coin-launcher--toss');
        elements.shadow.classList.remove('arcade-coin-shadow--toss');
        void elements.coin.offsetWidth;

        elements.coin.classList.add('arcade-coin--spinning');
        elements.launcher.classList.add('arcade-coin-launcher--toss');
        elements.shadow.classList.add('arcade-coin-shadow--toss');

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
    void streak.hydrate();
}
