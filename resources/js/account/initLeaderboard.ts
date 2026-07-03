import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { fetchLeaderboard, renderLeaderboardRows } from '@/account/leaderboardTable';
import leaderboardHtml from './templates/html/leaderboard.html?raw';

export async function initLeaderboardPage(root: HTMLElement, game: string, mode: string): Promise<void> {
    const data = await fetchLeaderboard(game, mode);

    mountTemplate(root, fillTemplate(leaderboardHtml, {
        label: data.label,
        rows: renderLeaderboardRows(data.entries),
        emptyState: '',
    }, ['rows', 'emptyState']));
}
