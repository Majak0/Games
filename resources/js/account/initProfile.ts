import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { formatElapsedMicroseconds } from '@/games/shared/countryQuiz/timer';
import { apiFetch } from '@/lib/api';
import { fetchCurrentUser, logout } from '@/lib/auth';
import { fetchLeaderboard, renderLeaderboardRows } from '@/account/leaderboardTable';
import { fetchModeCatalog, groupModesByGame, type ModeCatalogEntry } from '@/account/modeCatalog';
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

const PROFILE_GAME_TABS = [
    { game: 'shape-quiz', label: 'Pays' },
    { game: 'flag-quiz', label: 'Drapeaux' },
    { game: 'pile-ou-face', label: 'Pile/face' },
    { game: 'blackjack', label: 'Blackjack' },
] as const;

type ProfileGame = (typeof PROFILE_GAME_TABS)[number]['game'];

function isProfileGame(value: string | undefined): value is ProfileGame {
    return PROFILE_GAME_TABS.some((tab) => tab.game === value);
}

const HASARD_GAMES = new Set(['pile-ou-face', 'blackjack']);

function isHasardGame(game: string): boolean {
    return HASARD_GAMES.has(game);
}

interface ProfileModeGroup {
    id: string;
    label: string;
    modes: ModeCatalogEntry[];
}

function chronoMinutes(mode: string): number {
    const match = /^chrono:(\d+)$/.exec(mode);

    return match ? Number(match[1]) : 0;
}

function chronoDurationLabel(mode: string): string {
    const minutes = chronoMinutes(mode);

    return minutes > 0 ? `${minutes} min` : mode;
}

function groupCatalogModes(entries: ModeCatalogEntry[]): ProfileModeGroup[] {
    const groups: ProfileModeGroup[] = [];
    let chronoGroup: ProfileModeGroup | null = null;

    for (const entry of entries) {
        if (!entry.mode.startsWith('chrono:')) {
            groups.push({ id: entry.mode, label: entry.label, modes: [entry] });
            continue;
        }

        if (!chronoGroup) {
            chronoGroup = { id: 'chrono', label: 'Contre-la-montre', modes: [] };
            groups.push(chronoGroup);
        }

        chronoGroup.modes.push(entry);
    }

    chronoGroup?.modes.sort((left, right) => chronoMinutes(left.mode) - chronoMinutes(right.mode));

    return groups;
}

function renderChoiceButtons(
    container: HTMLElement,
    items: Array<{ value: string; label: string }>,
    dataKey: 'game' | 'mode' | 'modeGroup',
    activeValue: string | null
): void {
    container.replaceChildren(
        ...items.map((item) => {
            const button = document.createElement('button');
            const isActive = item.value === activeValue;

            button.type = 'button';
            button.className = `arcade-btn ${isActive ? 'arcade-btn--active' : 'arcade-btn--ghost'}`;
            button.dataset[dataKey] = item.value;
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            button.textContent = item.label;

            return button;
        })
    );
}

function emptyRow(columnCount: number, message: string): string {
    return `<tr><td colspan="${columnCount}" class="text-center text-zinc-400 py-6">${message}</td></tr>`;
}

function renderScoreRows(scores: ProfileScoreRow[], game: string, mode: string): string {
    const hideTime = isHasardGame(game);
    const row = scores.find((entry) => entry.game === game && entry.mode === mode);

    if (!row) {
        return emptyRow(3, 'Aucun score enregistré pour ce mode. Jouez une partie !');
    }

    return fillTemplate(profileRowHtml, {
        scoreDisplay: hideTime
            ? String(row.score)
            : `${row.score}${row.completed ? ' ✓' : ''}`,
        time: hideTime
            ? '—'
            : formatElapsedMicroseconds(row.elapsed_microseconds),
        rank: String(row.rank),
    });
}

function setupScorePicker(
    root: HTMLElement,
    catalog: ModeCatalogEntry[],
    scores: ProfileScoreRow[],
    username: string
): void {
    const grouped = groupModesByGame(catalog);
    const gameButtons = root.querySelector('#profile-game-buttons') as HTMLElement;
    const modeButtons = root.querySelector('#profile-mode-buttons') as HTMLElement;
    const chronoDurations = root.querySelector('#profile-chrono-durations') as HTMLElement;
    const scoreTable = root.querySelector('#profile-score-table') as HTMLTableElement;
    const leaderboardTable = root.querySelector('#profile-leaderboard-table') as HTMLTableElement;
    const scoreSubtitle = root.querySelector('#profile-score-subtitle') as HTMLParagraphElement;
    const scoreRows = root.querySelector('#profile-score-rows') as HTMLTableSectionElement;
    const title = root.querySelector('#leaderboard-title') as HTMLParagraphElement;
    const leaderboardRows = root.querySelector('#leaderboard-rows') as HTMLTableSectionElement;
    let activeGame: ProfileGame | null = null;
    let activeGroup: string | null = null;
    let activeMode: string | null = null;

    const currentGroups = (): ProfileModeGroup[] => (
        activeGame ? groupCatalogModes(grouped[activeGame] ?? []) : []
    );

    const selectedGroup = (): ProfileModeGroup | undefined => (
        currentGroups().find((group) => group.id === activeGroup)
    );

    const setStreakLayout = (isStreak: boolean): void => {
        const scoreHeader = isStreak ? 'Plus longue série' : 'Score';

        [scoreTable, leaderboardTable].forEach((table) => {
            table.classList.toggle('arcade-score-table--streak', isStreak);
            const header = table.querySelector('[data-score-header]');

            if (header) {
                header.textContent = scoreHeader;
            }
        });
    };

    const loadLeaderboard = async (): Promise<void> => {
        if (!activeGame || !activeMode) {
            leaderboardRows.innerHTML = '';
            title.textContent = '';

            return;
        }

        title.textContent = 'Chargement…';

        try {
            const data = await fetchLeaderboard(activeGame, activeMode);
            title.textContent = data.label;

            const userEntry = data.entries.find((entry) => entry.username === username);

            leaderboardRows.innerHTML = renderLeaderboardRows(
                userEntry ? [userEntry] : [],
                {
                    includeUsername: false,
                    hideTime: isHasardGame(activeGame),
                }
            );
        } catch {
            title.textContent = 'Impossible de charger le classement.';
            leaderboardRows.innerHTML = '';
        }
    };

    const renderScores = (): void => {
        const isStreak = activeGame !== null && isHasardGame(activeGame);

        setStreakLayout(isStreak);

        if (!activeGame) {
            scoreSubtitle.textContent = '';
            scoreRows.innerHTML = emptyRow(3, 'Choisissez un type de jeu pour afficher vos scores.');
            leaderboardRows.innerHTML = emptyRow(3, 'Choisissez un type de jeu pour afficher le classement.');
            title.textContent = '';

            return;
        }

        if (!activeMode) {
            scoreSubtitle.textContent = '';
            scoreRows.innerHTML = emptyRow(3, 'Choisissez un mode pour afficher vos scores.');
            leaderboardRows.innerHTML = emptyRow(3, 'Choisissez un mode pour afficher le classement.');
            title.textContent = '';

            return;
        }

        const group = selectedGroup();
        const selectedMode = group?.modes.find((entry) => entry.mode === activeMode);

        scoreSubtitle.textContent = group?.label ?? selectedMode?.label ?? '';
        scoreRows.innerHTML = renderScoreRows(scores, activeGame, activeMode);
        void loadLeaderboard();
    };

    const renderChronoDurations = (): void => {
        const group = selectedGroup();
        const isChrono = group?.id === 'chrono' && (group.modes.length ?? 0) > 1;

        if (!isChrono || !group) {
            chronoDurations.hidden = true;
            chronoDurations.replaceChildren();

            return;
        }

        chronoDurations.hidden = false;
        renderChoiceButtons(
            chronoDurations,
            group.modes.map((entry) => ({ value: entry.mode, label: chronoDurationLabel(entry.mode) })),
            'mode',
            activeMode
        );
    };

    const renderModeButtons = (): void => {
        const groups = currentGroups();

        if (!activeGame || groups.length === 0) {
            modeButtons.hidden = true;
            modeButtons.replaceChildren();

            return;
        }

        modeButtons.hidden = false;
        renderChoiceButtons(
            modeButtons,
            groups.map((group) => ({ value: group.id, label: group.label })),
            'modeGroup',
            activeGroup
        );
    };

    const applySelection = (): void => {
        renderChoiceButtons(
            gameButtons,
            PROFILE_GAME_TABS.map((tab) => ({ value: tab.game, label: tab.label })),
            'game',
            activeGame
        );
        renderModeButtons();
        renderChronoDurations();
        renderScores();
    };

    const selectGroup = (group: ProfileModeGroup): void => {
        activeGroup = group.id;
        activeMode = group.modes[0]?.mode ?? null;
    };

    gameButtons.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-game]');

        if (!button || !isProfileGame(button.dataset.game) || button.dataset.game === activeGame) {
            return;
        }

        activeGame = button.dataset.game;
        const groups = currentGroups();

        if (groups.length === 1) {
            selectGroup(groups[0]);
        } else {
            activeGroup = null;
            activeMode = null;
        }

        applySelection();
    });

    modeButtons.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-mode-group]');
        const groupId = button?.dataset.modeGroup;
        const group = currentGroups().find((entry) => entry.id === groupId);

        if (!group || group.id === activeGroup) {
            return;
        }

        selectGroup(group);
        applySelection();
    });

    chronoDurations.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-mode]');
        const mode = button?.dataset.mode;

        if (!mode || mode === activeMode) {
            return;
        }

        activeMode = mode;
        applySelection();
    });

    applySelection();
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

    mountTemplate(root, fillTemplate(profileHtml, {
        username: user.username,
    }));

    setupScorePicker(root, catalog, profile.scores, user.username);

    root.querySelector('#logout-button')?.addEventListener('click', async () => {
        await logout();
        window.location.href = '/';
    });
}
