import { fillTemplate } from '@/games/shared/fillTemplate';
import { formatElapsedMicroseconds } from '@/games/shared/countryQuiz/timer';
import { apiFetch } from '@/lib/api';
import leaderboardRowHtml from './templates/html/leaderboardRow.html?raw';

export interface LeaderboardEntry {
    rank: number;
    username: string;
    score: number;
    elapsed_microseconds: number;
    completed: boolean;
}

export interface LeaderboardData {
    label: string;
    entries: LeaderboardEntry[];
}

export async function fetchLeaderboard(game: string, mode: string): Promise<LeaderboardData> {
    return apiFetch<LeaderboardData>(`/api/leaderboards/${game}/${mode}`);
}

export function renderLeaderboardRows(entries: LeaderboardEntry[]): string {
    if (entries.length === 0) {
        return '<tr><td colspan="4" class="text-center text-zinc-400 py-6">Aucun score pour ce mode.</td></tr>';
    }

    return entries
        .map((entry) => fillTemplate(leaderboardRowHtml, {
            rank: String(entry.rank),
            username: entry.username,
            scoreDisplay: `${entry.score}${entry.completed ? ' ✓' : ''}`,
            time: formatElapsedMicroseconds(entry.elapsed_microseconds),
        }))
        .join('');
}
