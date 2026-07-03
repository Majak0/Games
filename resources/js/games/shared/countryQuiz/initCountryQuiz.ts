import {
    createQuizState,
    advanceQuizOnCorrect,
    advanceQuizOnFreeEntry,
    getAnswerFeedback,
    findExactCountryMatch,
    getFreeEntryFeedback,
    getRemainingCount,
    getRemainingCountries,
    getScoreLabel,
    isQuizComplete,
    skipCurrentFlag,
    QuizState,
} from './gameLogic';
import type { CountryQuizGameConfig, CountryQuizMode } from './config';
import { getCountryVisualUrl } from './config';
import {
    createGameTimer,
    formatElapsedMicroseconds,
    formatScoreWithTime,
    type GameTimer,
} from './timer';
import { mountCountryQuizTemplate, renderFoundVisualsBarTemplate } from './templates';
import { mapApiCountry, type ApiCountry } from './apiCountry';
import type { Country } from '@/types/country';
import { attachScoreSaveStatus, scoreSaveSectionHtml } from '@/scores/attachScoreSaveStatus';

export async function initCountryQuiz(
    root: HTMLElement,
    mode: CountryQuizMode,
    config: CountryQuizGameConfig
): Promise<void> {
    root.textContent = '';

    const poolQuery = mode.pool === 'sovereign'
        ? '?pool=sovereign'
        : mode.pool === 'world'
            ? '?pool=world'
            : mode.pool === 'map'
                ? '?pool=map'
                : '';
    const response = await fetch(`/api/countries${poolQuery}`);
    const countriesData: ApiCountry[] = await response.json();

    const countries: Country[] = countriesData
        .map(mapApiCountry)
        .filter((country) => getCountryVisualUrl(country, config.visual) !== '');

    if (countries.length === 0) {
        mountCountryQuizTemplate(root, 'emptyState', {
            message: config.labels.emptyMessage,
        });
        return;
    }

    let state: QuizState = createQuizState(countries);
    const timer: GameTimer = createGameTimer(
        mode.timeLimitMs ? { countdownMs: mode.timeLimitMs } : undefined
    );
    let animationFrameId = 0;
    let gameEnded = false;

    const strictBlind = Boolean(mode.hideVisual && mode.freeEntry);

    mountCountryQuizTemplate(root, 'game', {
        remainingCount: getRemainingCount(state),
        scoreLabel: getScoreLabel(state.score),
        visualUrl: getCountryVisualUrl(state.question.correct, config.visual),
        modeLabel: mode.title,
        hideVisual: mode.hideVisual,
        strictBlind,
        visual: config.visual,
        labels: config.labels,
        inputPlaceholder: mode.freeEntry
            ? 'Tapez le nom d\'un pays...'
            : 'Quel est le nom de ce pays ?',
    });

    const form = root.querySelector('form') as HTMLFormElement;
    const input = root.querySelector('#country-input') as HTMLInputElement;
    const feedback = root.querySelector('#feedback') as HTMLParagraphElement;
    const scoreDisplay = root.querySelector('#score') as HTMLDivElement;
    const timerDisplay = root.querySelector('#timer') as HTMLDivElement;
    const remainingDisplay = root.querySelector('#remaining') as HTMLDivElement;
    const foundList = root.querySelector('#found-list') as HTMLDivElement;
    const visualImage = root.querySelector('#quiz-visual') as HTMLImageElement | null;
    const skipButton = root.querySelector('#skip-flag') as HTMLButtonElement;
    const endGameButton = root.querySelector('#end-game') as HTMLButtonElement;

    function updateFeedback(message: string, colorClass: string): void {
        if (!feedback) {
            return;
        }

        feedback.textContent = message;
        feedback.className = `text-sm font-bold ${colorClass}`;
    }

    function updateScore(): void {
        if (!scoreDisplay) {
            return;
        }

        scoreDisplay.textContent = getScoreLabel(state.score);
    }

    function updateRemaining(): void {
        if (!remainingDisplay) {
            return;
        }

        remainingDisplay.textContent = `Restants : ${getRemainingCount(state)}`;
    }

    function updateTimerDisplay(): void {
        if (!timerDisplay) {
            return;
        }

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

    function skipFlag(): void {
        state = skipCurrentFlag(state);
        loadQuestion();
        updateFeedback('Pays reporté.', 'arcade-feedback--neutral');
    }

    function loadQuestion(): void {
        if (visualImage) {
            visualImage.src = getCountryVisualUrl(state.question.correct, config.visual);
            visualImage.alt = config.labels.visualAlt;
        }

        input.value = '';
        input.focus();
        updateFeedback('', 'arcade-feedback--neutral');
    }

    function renderFoundVisuals(): void {
        if (strictBlind || !foundList) {
            return;
        }

        foundList.innerHTML = renderFoundVisualsBarTemplate(state.foundCountries, config.visual);
    }

    function renderEndScreen(finalElapsedMicroseconds: number, completed: boolean, heading?: string): void {
        gameEnded = true;

        mountCountryQuizTemplate(root, 'end', {
            badge: completed ? 'Félicitations !' : 'Score final',
            heading: heading ?? (completed
                ? config.labels.endCompleteHeading
                : 'Partie terminée'),
            scoreSummary: formatScoreWithTime(
                state.score,
                finalElapsedMicroseconds,
                config.labels.scoreUnitSingular,
                config.labels.scoreUnitPlural
            ),
            scoreSaveSection: scoreSaveSectionHtml,
            foundCountries: state.foundCountries,
            backHref: config.backHref,
            visual: config.visual,
        });

        void attachScoreSaveStatus(root, state.score, finalElapsedMicroseconds, completed);
    }

    function endGame(completed: boolean, heading?: string): void {
        if (gameEnded) {
            return;
        }

        const elapsed = stopTimer();
        renderEndScreen(elapsed, completed, heading);
    }

    function handleCorrectAnswer(): void {
        if (mode.freeEntry) {
            const matched = findExactCountryMatch(input.value, getRemainingCountries(state));

            if (!matched) {
                return;
            }

            state = advanceQuizOnFreeEntry(state, matched);
        } else {
            state = advanceQuizOnCorrect(state);
        }
        updateScore();
        updateRemaining();
        renderFoundVisuals();

        if (mode.endOnComplete && isQuizComplete(state)) {
            endGame(true);
            return;
        }

        updateFeedback(
            mode.freeEntry
                ? (strictBlind ? 'Exact !' : config.labels.correctFreeEntry)
                : config.labels.correctNormal,
            'arcade-feedback--success'
        );
        loadQuestion();
    }

    function refreshFeedback(): void {
        if (gameEnded || !input.value.trim()) {
            if (!gameEnded && !input.value.trim()) {
                updateFeedback('', 'arcade-feedback--neutral');
            }
            return;
        }

        if (mode.freeEntry) {
            const result = getFreeEntryFeedback(state, input.value);

            switch (result) {
                case 'already-found':
                    updateFeedback('Ce pays est déjà trouvé.', 'arcade-feedback--close');
                    break;
                case 'correct':
                    handleCorrectAnswer();
                    break;
                case 'close':
                    updateFeedback('Vous êtes proche !', 'arcade-feedback--close');
                    break;
                case 'wrong':
                    updateFeedback('Ce pays n\'est pas dans la liste.', 'arcade-feedback--error');
                    break;
            }

            return;
        }

        const result = getAnswerFeedback(state.question, input.value);

        switch (result) {
            case 'correct':
                handleCorrectAnswer();
                break;
            case 'close':
                updateFeedback('Vous êtes proche !', 'arcade-feedback--close');
                break;
            case 'wrong':
                updateFeedback('Ce n’est pas la bonne réponse.', 'arcade-feedback--error');
                break;
        }
    }

    input.addEventListener('input', refreshFeedback);

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        refreshFeedback();
    });

    skipButton?.addEventListener('click', skipFlag);
    endGameButton?.addEventListener('click', () => endGame(false));

    timer.start();
    updateTimerDisplay();
    renderFoundVisuals();
    updateRemaining();
}
