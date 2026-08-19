import {
    fetchSavedBestStreak,
    saveBestStreakIfImproved,
    type HasardScoreGame,
} from '@/scores/saveBestStreak';

export interface StreakElements {
    wins: HTMLElement;
    losses: HTMLElement;
    bestStreak: HTMLElement;
}

export interface StreakTracker {
    recordWin: () => void;
    recordLoss: () => void;
    hydrate: () => Promise<void>;
}

export function createStreakTracker(
    game: HasardScoreGame,
    elements: StreakElements,
): StreakTracker {
    let wins = 0;
    let losses = 0;
    let streak = 0;
    let bestStreak = 0;
    let savedBestStreak = 0;

    function render(): void {
        elements.wins.textContent = String(wins);
        elements.losses.textContent = String(losses);
        elements.bestStreak.textContent = String(bestStreak);
    }

    async function persistBestStreak(): Promise<void> {
        savedBestStreak = await saveBestStreakIfImproved(
            game,
            bestStreak,
            savedBestStreak,
        );
    }

    return {
        recordWin(): void {
            wins += 1;
            streak += 1;
            bestStreak = Math.max(bestStreak, streak);
            render();
            void persistBestStreak();
        },
        recordLoss(): void {
            losses += 1;
            streak = 0;
            render();
        },
        async hydrate(): Promise<void> {
            savedBestStreak = await fetchSavedBestStreak(game);
            bestStreak = Math.max(bestStreak, savedBestStreak);
            render();
        },
    };
}
