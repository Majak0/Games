import { fillTemplate } from '@/games/shared/fillTemplate';
import { formatElapsedMicroseconds } from '@/games/shared/countryQuiz/timer';
import { apiFetch } from '@/lib/api';
import leaderboardRowHtml from './templates/html/leaderboardRow.html?raw';
import leaderboardRowProfileHtml from './templates/html/leaderboardRowProfile.html?raw';

export interface LeaderboardRenderOptions {
    includeUsername?: boolean;
    hideTime?: boolean;
    total?: number;
}

export interface LeaderboardEntry {
    rank: number;
    username: string;
    score: number;
    elapsed_microseconds: number;
    completed: boolean;
}

export interface LeaderboardData {
    label: string;
    total: number;
    entries: LeaderboardEntry[];
}

export async function fetchLeaderboard(game: string, mode: string): Promise<LeaderboardData> {
    return apiFetch<LeaderboardData>(`/api/leaderboards/${game}/${mode}`);
}

export function renderLeaderboardRows(
    entries: LeaderboardEntry[],
    options: LeaderboardRenderOptions = {}
): string {
    const includeUsername = options.includeUsername ?? true;
    const hideTime = options.hideTime ?? false;
    const rowTemplate = includeUsername ? leaderboardRowHtml : leaderboardRowProfileHtml;
    const columnCount = includeUsername ? 4 : 3;

    if (entries.length === 0) {
        return `<tr><td colspan="${columnCount}" class="text-center text-zinc-400 py-6">Aucun score pour ce mode.</td></tr>`;
    }

    return entries
        .map((entry) => fillTemplate(rowTemplate, {
            rank: String(entry.rank),
            rankDisplay: `${entry.rank}`,
            username: entry.username,
            scoreDisplay: hideTime
                ? String(entry.score)
                : `${entry.score}${entry.completed ? ' ✓' : ''}`,
            time: hideTime ? '—' : formatElapsedMicroseconds(entry.elapsed_microseconds),
        }))
        .join('');
}
