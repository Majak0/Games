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
import type { FlagQuizMode } from './modes';
import {
    createGameTimer,
    formatElapsedMicroseconds,
    formatScoreWithTime,
    type GameTimer,
} from './timer';
import { mountFlagQuizTemplate, renderFoundFlagsBarTemplate } from './templates';

export async function initFlagQuiz(root: HTMLElement, mode: FlagQuizMode): Promise<void> {
    root.textContent = '';

    const poolQuery = mode.pool === 'sovereign' ? '?pool=sovereign' : '';
    const response = await fetch(`/api/countries${poolQuery}`);
    const countriesData = await response.json();

    const COUNTRIES = countriesData.map((country: { name: string; flag_url: string }) => ({
        name: country.name,
        flagUrl: country.flag_url,
    }));

    if (COUNTRIES.length === 0) {
        mountFlagQuizTemplate(root, 'emptyState', {
            message: 'Aucun drapeau disponible. Lancez le seeder des pays.',
        });
        return;
    }

    let state: QuizState = createQuizState(COUNTRIES, 4);
    const timer: GameTimer = createGameTimer(
        mode.timeLimitMs ? { countdownMs: mode.timeLimitMs } : undefined
    );
    let animationFrameId = 0;
    let gameEnded = false;

    mountFlagQuizTemplate(root, 'game', {
        remainingCount: getRemainingCount(state),
        scoreLabel: getScoreLabel(state.score),
        flagUrl: state.question.correct.flagUrl,
        modeLabel: mode.title,
        hideFlag: mode.hideFlag,
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
    const flagImage = root.querySelector('#flag-image') as HTMLImageElement | null;
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
        state = skipCurrentFlag(state, 4);
        loadQuestion();
        updateFeedback('Pays reporté.', 'arcade-feedback--neutral');
    }

    function loadQuestion(): void {
        if (flagImage) {
            flagImage.src = state.question.correct.flagUrl;
            flagImage.alt = 'Drapeau du pays à deviner';
        }

        input.value = '';
        input.focus();
        updateFeedback('', 'arcade-feedback--neutral');
    }

    function renderFoundFlags(): void {
        if (!foundList) {
            return;
        }

        foundList.innerHTML = renderFoundFlagsBarTemplate(state.foundCountries);
    }

    function renderEndScreen(finalElapsedMicroseconds: number, completed: boolean, heading?: string): void {
        gameEnded = true;

        mountFlagQuizTemplate(root, 'end', {
            badge: completed ? 'Félicitations !' : 'Score final',
            heading: heading ?? (completed
                ? 'Vous avez trouvé tous les drapeaux !'
                : 'Partie terminée'),
            scoreSummary: formatScoreWithTime(state.score, finalElapsedMicroseconds),
            foundCountries: state.foundCountries,
        });
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

            state = advanceQuizOnFreeEntry(state, matched, 4);
        } else {
            state = advanceQuizOnCorrect(state, 4);
        }
        updateScore();
        updateRemaining();
        renderFoundFlags();

        if (mode.endOnComplete && isQuizComplete(state)) {
            endGame(true);
            return;
        }

        updateFeedback(
            mode.freeEntry ? 'Exact ! Drapeau ajouté.' : 'Exact ! Nouvel indice...',
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
    renderFoundFlags();
    updateRemaining();
}
