import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import {
    createGameTimer,
    formatElapsedMicroseconds,
    formatScoreWithTime,
    type GameTimer,
} from '@/games/shared/countryQuiz/timer';
import { attachScoreSaveStatus, scoreSaveSectionHtml } from '@/scores/attachScoreSaveStatus';
import { guessLogo, skipLogo, startLogoQuiz, type FoundLogo, type LogoQuizPayload } from './api';
import type { LogoQuizMode } from './modes';
import emptyStateHtml from './templates/html/emptyState.html?raw';
import endScreenHtml from './templates/html/endScreen.html?raw';
import gameScreenHtml from './templates/html/gameScreen.html?raw';

function foundLogoThumb(logo: FoundLogo): string {
    return fillTemplate(
        '<span class="arcade-logo-thumb" title="{{name}}"><img src="{{imageUrl}}" alt="{{name}}" decoding="async" loading="lazy" /></span>',
        { name: logo.name, imageUrl: logo.visual_url },
        ['imageUrl'],
    );
}

function scoreLabel(score: number): string {
    return `Trouvés : ${score}`;
}

export async function initLogoQuiz(root: HTMLElement, mode: LogoQuizMode): Promise<void> {
    root.textContent = '';

    let payload: LogoQuizPayload;

    try {
        payload = await startLogoQuiz({
            style: mode.style,
            category: mode.category,
        });
    } catch (error) {
        mountTemplate(root, fillTemplate(emptyStateHtml, {
            message: error instanceof Error
                ? error.message
                : 'Aucun logo disponible pour le moment.',
        }));
        return;
    }

    if (!payload.visual_url) {
        mountTemplate(root, fillTemplate(emptyStateHtml, {
            message: 'Aucun logo disponible pour le moment.',
        }));
        return;
    }

    const timer: GameTimer = createGameTimer(
        mode.timeLimitMs ? { countdownMs: mode.timeLimitMs } : undefined,
    );
    let animationFrameId = 0;
    let gameEnded = false;
    let guessTimer = 0;
    let requestVersion = 0;

    mountTemplate(root, fillTemplate(gameScreenHtml, {
        remainingCount: payload.remaining,
        scoreLabel: scoreLabel(payload.score),
        imageUrl: payload.visual_url,
        imageClass: payload.wordmark
            ? `${mode.imageClass} arcade-logo-frame__image--wordmark`
            : mode.imageClass,
        imageAlt: mode.imageAlt,
        modeLabel: mode.title,
    }));

    const form = root.querySelector('form') as HTMLFormElement;
    const input = root.querySelector('#logo-input') as HTMLInputElement;
    const feedback = root.querySelector('#feedback') as HTMLParagraphElement;
    const scoreDisplay = root.querySelector('#score') as HTMLDivElement;
    const timerDisplay = root.querySelector('#timer') as HTMLDivElement;
    const remainingDisplay = root.querySelector('#remaining') as HTMLDivElement;
    const foundList = root.querySelector('#found-list') as HTMLDivElement;
    const logoImage = root.querySelector('#quiz-logo') as HTMLImageElement;
    const skipButton = root.querySelector('#skip-logo') as HTMLButtonElement;
    const endGameButton = root.querySelector('#end-game') as HTMLButtonElement;

    function updateFeedback(message: string, colorClass: string): void {
        feedback.textContent = message;
        feedback.className = `text-sm font-bold ${colorClass}`;
    }

    function applyPayload(next: LogoQuizPayload): void {
        const previousFoundCount = payload.found.length;
        payload = next;
        remainingDisplay.textContent = `Restants : ${next.remaining}`;
        scoreDisplay.textContent = scoreLabel(next.score);

        if (next.found.length < previousFoundCount) {
            foundList.replaceChildren();
            next.found.forEach((logo) => {
                foundList.insertAdjacentHTML('beforeend', foundLogoThumb(logo));
            });
        } else {
            for (let index = previousFoundCount; index < next.found.length; index++) {
                foundList.insertAdjacentHTML('beforeend', foundLogoThumb(next.found[index]));
            }
        }

        const nextClass = [
            'arcade-logo-frame__image',
            mode.imageClass,
            next.wordmark ? 'arcade-logo-frame__image--wordmark' : '',
        ].filter(Boolean).join(' ');

        if (logoImage.className !== nextClass) {
            logoImage.className = nextClass;
        }

        if (next.visual_url && logoImage.getAttribute('src') !== next.visual_url) {
            logoImage.src = next.visual_url;
        }
    }

    function updateTimerDisplay(): void {
        timerDisplay.textContent = formatElapsedMicroseconds(timer.getDisplayMicroseconds());

        if (timer.hasExpired()) {
            endGame(false, 'Temps écoulé !');
            return;
        }

        if (timer.isRunning()) {
            animationFrameId = requestAnimationFrame(updateTimerDisplay);
        }
    }

    function stopTimer(): number {
        cancelAnimationFrame(animationFrameId);

        return timer.stop();
    }

    function renderEndScreen(finalElapsedMicroseconds: number, completed: boolean, heading?: string): void {
        gameEnded = true;

        mountTemplate(root, fillTemplate(endScreenHtml, {
            badge: completed ? 'Félicitations !' : 'Score final',
            heading: heading ?? (completed ? 'Vous avez trouvé tous les logos !' : 'Partie terminée'),
            scoreSummary: formatScoreWithTime(
                payload.score,
                finalElapsedMicroseconds,
                'logo',
                'logos',
            ),
            scoreSaveSection: scoreSaveSectionHtml,
            foundLogos: payload.found.map(foundLogoThumb).join(''),
        }, ['scoreSaveSection', 'foundLogos']));

        void attachScoreSaveStatus(root, payload.score, finalElapsedMicroseconds, completed);
    }

    function endGame(completed: boolean, heading?: string): void {
        if (gameEnded) {
            return;
        }

        renderEndScreen(stopTimer(), completed, heading);
    }

    async function submitGuess(): Promise<void> {
        const answer = input.value.trim();

        if (gameEnded || !answer) {
            if (!gameEnded && !answer) {
                updateFeedback('', 'arcade-feedback--neutral');
            }

            return;
        }

        const version = ++requestVersion;

        try {
            const result = await guessLogo(answer);

            if (version !== requestVersion || gameEnded) {
                return;
            }

            if (result.result !== 'correct') {
                updateFeedback(
                    result.result === 'close'
                        ? 'Vous êtes proche !'
                        : 'Ce n’est pas la bonne marque.',
                    result.result === 'close' ? 'arcade-feedback--close' : 'arcade-feedback--error',
                );
                return;
            }

            applyPayload({
                remaining: result.remaining ?? payload.remaining,
                score: result.score ?? payload.score,
                completed: result.completed ?? false,
                visual_url: result.visual_url ?? null,
                wordmark: result.wordmark ?? false,
                found: result.found ?? payload.found,
            });
            input.value = '';
            input.focus();

            if (mode.endOnComplete && result.completed) {
                endGame(true);
                return;
            }

            updateFeedback('Exact !', 'arcade-feedback--success');
        } catch {
            if (version === requestVersion && !gameEnded) {
                updateFeedback('Vérification impossible.', 'arcade-feedback--error');
            }
        }
    }

    function scheduleGuess(): void {
        window.clearTimeout(guessTimer);
        guessTimer = window.setTimeout(() => {
            void submitGuess();
        }, 320);
    }

    input.addEventListener('input', scheduleGuess);
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        window.clearTimeout(guessTimer);
        void submitGuess();
    });
    skipButton.addEventListener('click', () => {
        void skipLogo().then((next) => {
            if (gameEnded) {
                return;
            }

            applyPayload(next);
            input.value = '';
            input.focus();
            updateFeedback('Logo reporté.', 'arcade-feedback--neutral');
        });
    });
    endGameButton.addEventListener('click', () => endGame(false));

    timer.start();
    updateTimerDisplay();
    applyPayload(payload);
}
