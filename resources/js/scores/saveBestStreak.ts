import { apiFetch } from '@/lib/api';
import { fetchCurrentUser } from '@/lib/auth';
import { submitScore } from '@/scores/submitScore';
import type { ScoreGame } from '@/scores/modeKey';

export const HASARD_STREAK_MODE = 'serie';

export type HasardScoreGame = Extract<ScoreGame, 'pile-ou-face' | 'blackjack'>;

export async function fetchSavedBestStreak(game: HasardScoreGame): Promise<number> {
    const user = await fetchCurrentUser();

    if (!user) {
        return 0;
    }

    try {
        const profile = await apiFetch<{
            scores: Array<{ game: string; mode: string; score: number }>;
        }>('/api/scores/me');

        const row = profile.scores.find(
            (entry) => entry.game === game && entry.mode === HASARD_STREAK_MODE
        );

        return row?.score ?? 0;
    } catch {
        return 0;
    }
}

export async function saveBestStreakIfImproved(
    game: HasardScoreGame,
    bestStreak: number,
    savedBestStreak: number
): Promise<number> {
    if (bestStreak <= savedBestStreak || bestStreak <= 0) {
        return savedBestStreak;
    }

    const result = await submitScore({
        game,
        mode: HASARD_STREAK_MODE,
        score: bestStreak,
        elapsedMicroseconds: 0,
        completed: true,
    });

    if (!result?.saved) {
        return savedBestStreak;
    }

    return bestStreak;
}
