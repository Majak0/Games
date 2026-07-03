import { fetchLeaderboard, renderLeaderboardRows } from '@/account/leaderboardTable';
import { fetchModeCatalog, GAME_LABELS, type ModeCatalogEntry } from '@/account/modeCatalog';
import modalHtml from './templates/html/leaderboardModal.html?raw';

let catalogCache: ModeCatalogEntry[] | null = null;
let activeLimit = 10;
let activeGame = '';
let cachedEntries: Awaited<ReturnType<typeof fetchLeaderboard>>['entries'] = [];

function getModalRoot(): HTMLElement {
    let root = document.getElementById('leaderboard-modal');

    if (!root) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml.trim();
        root = wrapper.firstElementChild as HTMLElement;
        document.body.appendChild(root);
        bindModalEvents(root);
    }

    return root;
}

function populateModeSelect(select: HTMLSelectElement, modes: ModeCatalogEntry[]): void {
    select.innerHTML = modes
        .map((entry) => `<option value="${entry.mode}">${entry.label}</option>`)
        .join('');
}

function setActiveTab(root: HTMLElement, limit: number): void {
    activeLimit = limit;

    root.querySelectorAll('.arcade-tabs__tab').forEach((tab) => {
        const button = tab as HTMLButtonElement;
        const isActive = Number(button.dataset.limit) === limit;

        button.classList.toggle('arcade-tabs__tab--active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
}

function renderRows(root: HTMLElement): void {
    const rows = root.querySelector('#leaderboard-modal-rows') as HTMLTableSectionElement;
    const slice = cachedEntries.slice(0, activeLimit);

    rows.innerHTML = renderLeaderboardRows(slice);
}

async function loadLeaderboard(root: HTMLElement): Promise<void> {
    const modeSelect = root.querySelector('#leaderboard-modal-mode') as HTMLSelectElement;
    const subtitle = root.querySelector('#leaderboard-modal-subtitle') as HTMLParagraphElement;
    const mode = modeSelect.value;

    if (!activeGame || !mode) {
        cachedEntries = [];
        subtitle.textContent = '';
        renderRows(root);

        return;
    }

    subtitle.textContent = 'Chargement…';

    try {
        const data = await fetchLeaderboard(activeGame, mode);
        cachedEntries = data.entries;
        subtitle.textContent = data.label;
        renderRows(root);
    } catch {
        cachedEntries = [];
        subtitle.textContent = 'Impossible de charger le classement.';
        renderRows(root);
    }
}

function closeModal(root: HTMLElement): void {
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('arcade-modal-open');
}

function openModal(root: HTMLElement): void {
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('arcade-modal-open');
}

function bindModalEvents(root: HTMLElement): void {
    const modeSelect = root.querySelector('#leaderboard-modal-mode') as HTMLSelectElement;

    root.querySelectorAll('[data-close-modal]').forEach((element) => {
        element.addEventListener('click', () => closeModal(root));
    });

    root.querySelectorAll('.arcade-tabs__tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const limit = Number((tab as HTMLButtonElement).dataset.limit);

            setActiveTab(root, limit);
            renderRows(root);
        });
    });

    modeSelect.addEventListener('change', () => {
        void loadLeaderboard(root);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !root.hidden) {
            closeModal(root);
        }
    });
}

export async function openLeaderboardModal(gameId: string): Promise<void> {
    const root = getModalRoot();
    const title = root.querySelector('#leaderboard-modal-title') as HTMLHeadingElement;
    const modeSelect = root.querySelector('#leaderboard-modal-mode') as HTMLSelectElement;

    if (!catalogCache) {
        catalogCache = await fetchModeCatalog();
    }

    const modes = catalogCache.filter((entry) => entry.game === gameId);

    if (modes.length === 0) {
        return;
    }

    activeGame = gameId;
    activeLimit = 10;
    setActiveTab(root, activeLimit);

    title.textContent = GAME_LABELS[gameId] ?? gameId;
    populateModeSelect(modeSelect, modes);

    openModal(root);
    await loadLeaderboard(root);
}
