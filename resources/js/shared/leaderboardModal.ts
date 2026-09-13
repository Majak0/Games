import { fetchLeaderboard, renderLeaderboardRows } from '@/account/leaderboardTable';
import {
    fetchModeCatalog,
    GAME_LABELS,
    groupCatalogModes,
    hasModeVariants,
    variantGroupAriaLabel,
    variantLabel,
    type ModeCatalogEntry,
    type ModeCatalogGroup,
} from '@/account/modeCatalog';
import modalHtml from './templates/html/leaderboardModal.html?raw';

let catalogCache: ModeCatalogEntry[] | null = null;
let activeLimit = 10;
let activeGame = '';
let activeGroupId: string | null = null;
let activeMode: string | null = null;
let currentGroups: ModeCatalogGroup[] = [];
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

function renderChoiceButtons(
    container: HTMLElement,
    items: Array<{ value: string; label: string }>,
    dataKey: 'mode' | 'modeGroup',
    activeValue: string | null,
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
        }),
    );
}

function selectedGroup(): ModeCatalogGroup | undefined {
    return currentGroups.find((group) => group.id === activeGroupId);
}

function selectGroup(group: ModeCatalogGroup): void {
    activeGroupId = group.id;
    activeMode = group.modes[0]?.mode ?? null;
}

function renderModeButtons(root: HTMLElement): void {
    const container = root.querySelector('#leaderboard-modal-modes') as HTMLElement;

    renderChoiceButtons(
        container,
        currentGroups.map((group) => ({ value: group.id, label: group.label })),
        'modeGroup',
        activeGroupId,
    );
}

function renderDurationButtons(root: HTMLElement): void {
    const container = root.querySelector('#leaderboard-modal-durations') as HTMLElement;
    const group = selectedGroup();

    if (!hasModeVariants(group)) {
        container.hidden = true;
        container.replaceChildren();
        return;
    }

    container.hidden = false;
    container.setAttribute('aria-label', variantGroupAriaLabel(group));
    renderChoiceButtons(
        container,
        group.modes.map((entry) => ({ value: entry.mode, label: variantLabel(entry) })),
        'mode',
        activeMode,
    );
}

function renderPickers(root: HTMLElement): void {
    renderModeButtons(root);
    renderDurationButtons(root);
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
    const subtitle = root.querySelector('#leaderboard-modal-subtitle') as HTMLParagraphElement;

    if (!activeGame || !activeMode) {
        cachedEntries = [];
        subtitle.textContent = '';
        renderRows(root);

        return;
    }

    subtitle.textContent = 'Chargement…';

    try {
        const data = await fetchLeaderboard(activeGame, activeMode);
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
    const modeButtons = root.querySelector('#leaderboard-modal-modes') as HTMLElement;
    const durationButtons = root.querySelector('#leaderboard-modal-durations') as HTMLElement;

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

    modeButtons.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-mode-group]');
        const group = currentGroups.find((entry) => entry.id === button?.dataset.modeGroup);

        if (!group || group.id === activeGroupId) {
            return;
        }

        selectGroup(group);
        renderPickers(root);
        void loadLeaderboard(root);
    });

    durationButtons.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-mode]');
        const mode = button?.dataset.mode;

        if (!mode || mode === activeMode) {
            return;
        }

        activeMode = mode;
        renderPickers(root);
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

    if (!catalogCache) {
        catalogCache = await fetchModeCatalog();
    }

    const modes = catalogCache.filter((entry) => entry.game === gameId);

    if (modes.length === 0) {
        return;
    }

    currentGroups = groupCatalogModes(modes);
    const firstGroup = currentGroups[0];

    if (!firstGroup) {
        return;
    }

    activeGame = gameId;
    activeLimit = 10;
    selectGroup(firstGroup);
    setActiveTab(root, activeLimit);
    title.textContent = GAME_LABELS[gameId] ?? gameId;
    renderPickers(root);

    openModal(root);
    await loadLeaderboard(root);
}
