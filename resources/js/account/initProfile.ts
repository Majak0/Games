import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { formatElapsedMicroseconds } from '@/games/shared/countryQuiz/timer';
import { apiFetch } from '@/lib/api';
import { fetchCurrentUser, logout } from '@/lib/auth';
import { fetchLeaderboard, renderLeaderboardRows } from '@/account/leaderboardTable';
import { fetchModeCatalog, GAME_LABELS, groupModesByGame, type ModeCatalogEntry } from '@/account/modeCatalog';
import profileHtml from './templates/html/profile.html?raw';
import profileRowHtml from './templates/html/profileRow.html?raw';

interface ProfileScoreRow {
    game: string;
    mode: string;
    label: string;
    score: number;
    elapsed_microseconds: number;
    completed: boolean;
    rank: number;
    total: number;
}

function populateSelect(select: HTMLSelectElement, options: Array<{ value: string; label: string }>): void {
    select.innerHTML = options
        .map((option) => `<option value="${option.value}">${option.label}</option>`)
        .join('');
}

function setupLeaderboardPicker(
    root: HTMLElement,
    catalog: ModeCatalogEntry[],
    username: string
): void {
    const grouped = groupModesByGame(catalog);
    const gameSelect = root.querySelector('#leaderboard-game') as HTMLSelectElement;
    const modeSelect = root.querySelector('#leaderboard-mode') as HTMLSelectElement;
    const title = root.querySelector('#leaderboard-title') as HTMLParagraphElement;
    const rows = root.querySelector('#leaderboard-rows') as HTMLTableSectionElement;

    const gameOptions = Object.keys(grouped).map((game) => ({
        value: game,
        label: GAME_LABELS[game] ?? game,
    }));

    populateSelect(gameSelect, gameOptions);

    const refreshModes = (): void => {
        const modes = grouped[gameSelect.value] ?? [];

        populateSelect(
            modeSelect,
            modes.map((entry) => ({ value: entry.mode, label: entry.label }))
        );
    };

    const loadLeaderboard = async (): Promise<void> => {
        const game = gameSelect.value;
        const mode = modeSelect.value;

        if (!game || !mode) {
            rows.innerHTML = '';
            title.textContent = '';

            return;
        }

        title.textContent = 'Chargement…';

        try {
            const data = await fetchLeaderboard(game, mode);
            title.textContent = data.label;

            const userEntry = data.entries.find((entry) => entry.username === username);

            rows.innerHTML = renderLeaderboardRows(
                userEntry ? [userEntry] : [],
                { includeUsername: false }
            );
        } catch {
            title.textContent = 'Impossible de charger le classement.';
            rows.innerHTML = '';
        }
    };

    refreshModes();
    void loadLeaderboard();

    gameSelect.addEventListener('change', () => {
        refreshModes();
        void loadLeaderboard();
    });

    modeSelect.addEventListener('change', () => {
        void loadLeaderboard();
    });
}

export async function initProfilePage(root: HTMLElement): Promise<void> {
    const user = await fetchCurrentUser();

    if (!user) {
        window.location.href = '/compte/connexion';
        return;
    }

    const [profile, catalog] = await Promise.all([
        apiFetch<{ scores: ProfileScoreRow[] }>('/api/scores/me'),
        fetchModeCatalog(),
    ]);

    const scoreRows = profile.scores
        .map((row) => fillTemplate(profileRowHtml, {
            label: row.label,
            scoreDisplay: ['pile-ou-face', 'blackjack'].includes(row.game)
                ? String(row.score)
                : `${row.score}${row.completed ? ' ✓' : ''}`,
            time: ['pile-ou-face', 'blackjack'].includes(row.game)
                ? '—'
                : formatElapsedMicroseconds(row.elapsed_microseconds),
            rank: String(row.rank),
        }))
        .join('');

    mountTemplate(root, fillTemplate(profileHtml, {
        rows: scoreRows || '<tr><td colspan="4" class="text-center text-zinc-400 py-6">Aucun score enregistré pour l\'instant. Jouez une partie !</td></tr>',
        emptyState: '',
    }, ['rows', 'emptyState']));

    setupLeaderboardPicker(root, catalog, user.username);

    root.querySelector('#logout-button')?.addEventListener('click', async () => {
        await logout();
        window.location.href = '/';
    });
}
