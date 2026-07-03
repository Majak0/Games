import {
    createQuizState,
    advanceQuizOnFreeEntry,
    findExactCountryMatch,
    getFreeEntryFeedback,
    getRemainingCount,
    getRemainingCountries,
    getScoreLabel,
    isQuizComplete,
    QuizState,
} from './gameLogic';
import type { CountryQuizGameConfig, CountryQuizMode } from './config';
import {
    createGameTimer,
    formatElapsedMicroseconds,
    formatScoreWithTime,
    type GameTimer,
} from './timer';
import { mountCountryQuizTemplate } from './templates';
import { mountMapGameScreen } from './templates/mapGameScreen';
import { renderMapRecentFoundList } from './templates/mapRecentFound';
import { highlightCountryOnMap, configureWorldMapTerritories } from './worldMap';
import { setupMapZoom } from './mapZoom';
import { mapApiCountry, type ApiCountry } from './apiCountry';
import type { Country } from '@/types/country';

export async function initMapQuiz(
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
    const [countriesResponse, mapMetaResponse] = await Promise.all([
        fetch(`/api/countries${poolQuery}`),
        fetch('/api/world-map-meta'),
    ]);
    const countriesData: ApiCountry[] = await countriesResponse.json();
    const mapMeta: { territoryParents: Record<string, string> } = await mapMetaResponse.json();
    const territoryParents = mapMeta.territoryParents ?? {};

    configureWorldMapTerritories(territoryParents);

    const countries: Country[] = countriesData
        .map(mapApiCountry)
        .filter((country) => Boolean(country.isoCode)) as Array<Country & { isoCode: string }>;

    if (countries.length === 0) {
        mountCountryQuizTemplate(root, 'emptyState', {
            message: config.labels.emptyMessage,
        });
        return;
    }

    const poolIsoCodes = new Set(countries.map((country) => country.isoCode!));
    const foundIsoCodes = new Set<string>();

    let state: QuizState = createQuizState(countries);
    const timer: GameTimer = createGameTimer(
        mode.timeLimitMs ? { countdownMs: mode.timeLimitMs } : undefined
    );
    let animationFrameId = 0;
    let gameEnded = false;

    mountMapGameScreen(root, {
        remainingCount: getRemainingCount(state),
        scoreLabel: getScoreLabel(state.score),
        modeLabel: mode.title,
        inputPlaceholder: 'Tapez le nom d\'un pays...',
        poolIsoCodes,
        foundIsoCodes,
        territoryParents,
    });

    const form = root.querySelector('form') as HTMLFormElement;
    const input = root.querySelector('#country-input') as HTMLInputElement;
    const feedback = root.querySelector('#feedback') as HTMLParagraphElement;
    const scoreDisplay = root.querySelector('#score') as HTMLDivElement;
    const timerDisplay = root.querySelector('#timer') as HTMLDivElement;
    const remainingDisplay = root.querySelector('#remaining') as HTMLDivElement;
    const endGameButton = root.querySelector('#end-game') as HTMLButtonElement;
    const recentFoundList = root.querySelector('#recent-found-list') as HTMLUListElement;
    const mapViewport = root.querySelector('#world-map-viewport') as HTMLDivElement;
    const mapTransform = root.querySelector('#world-map-transform') as HTMLDivElement;
    const zoomInButton = root.querySelector('#map-zoom-in') as HTMLButtonElement;
    const zoomOutButton = root.querySelector('#map-zoom-out') as HTMLButtonElement;
    const zoomResetButton = root.querySelector('#map-zoom-reset') as HTMLButtonElement;

    if (mapViewport && mapTransform) {
        const mapZoom = setupMapZoom(mapViewport, mapTransform);

        zoomInButton?.addEventListener('click', () => mapZoom.zoomIn());
        zoomOutButton?.addEventListener('click', () => mapZoom.zoomOut());
        zoomResetButton?.addEventListener('click', () => mapZoom.reset());
    }

    function renderRecentFound(): void {
        if (!recentFoundList) {
            return;
        }

        recentFoundList.innerHTML = renderMapRecentFoundList(state.foundCountries);
    }

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

    function renderEndScreen(finalElapsedMicroseconds: number, completed: boolean, heading?: string): void {
        gameEnded = true;

        mountCountryQuizTemplate(root, 'end', {
            badge: completed ? 'Félicitations !' : 'Score final',
            heading: heading ?? (completed
                ? 'Carte complète ! Tous les pays sont en vert.'
                : 'Partie terminée'),
            scoreSummary: formatScoreWithTime(
                state.score,
                finalElapsedMicroseconds,
                config.labels.scoreUnitSingular,
                config.labels.scoreUnitPlural
            ),
            foundCountries: state.foundCountries,
            backHref: config.backHref,
            visual: config.visual,
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
        const matched = findExactCountryMatch(input.value, getRemainingCountries(state));

        if (!matched?.isoCode) {
            return;
        }

        state = advanceQuizOnFreeEntry(state, matched);
        foundIsoCodes.add(matched.isoCode);
        highlightCountryOnMap(matched.isoCode);

        updateScore();
        updateRemaining();
        renderRecentFound();

        if (mode.endOnComplete && isQuizComplete(state)) {
            endGame(true);
            return;
        }

        updateFeedback('Exact ! Pays colorié en vert.', 'arcade-feedback--success');
        input.value = '';
        input.focus();
    }

    function refreshFeedback(): void {
        if (gameEnded || !input.value.trim()) {
            if (!gameEnded && !input.value.trim()) {
                updateFeedback('', 'arcade-feedback--neutral');
            }
            return;
        }

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
    }

    function keepInputFocused(): void {
        if (gameEnded) {
            return;
        }

        input.focus({ preventScroll: true });
    }

    root.addEventListener('mousedown', (event) => {
        if (gameEnded) {
            return;
        }

        const target = event.target;

        if (!(target instanceof Node) || input.contains(target)) {
            return;
        }

        // Empêche le focus de quitter l'input sans bloquer zoom / pan (contrairement à pointerdown).
        event.preventDefault();
    });

    input.addEventListener('blur', () => {
        requestAnimationFrame(keepInputFocused);
    });

    input.addEventListener('input', refreshFeedback);

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        refreshFeedback();
    });

    endGameButton?.addEventListener('click', () => endGame(false));

    timer.start();
    updateTimerDisplay();
    updateRemaining();
    keepInputFocused();
}
