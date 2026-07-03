import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { openLeaderboardModal } from '@/shared/leaderboardModal';
import { games } from '../games';
import menuHtml from './html/menu.html?raw';
import gameCardHtml from './html/gameCard.html?raw';

function renderLeaderboardButton(game: (typeof games)[number]): string {
    if (!game.available || game.id === 'coming-soon') {
        return '';
    }

    return `
        <button
            type="button"
            class="arcade-podium-btn"
            data-game-id="${game.id}"
            title="Classements"
            aria-label="Classements — ${game.title}"
        >
            <i class="bi bi-trophy-fill" aria-hidden="true"></i>
        </button>`;
}

function renderGameCard(game: (typeof games)[number]): string {
    return fillTemplate(gameCardHtml, {
        href: game.available ? game.href : '#',
        cardModifier: game.available ? '' : 'arcade-game-card--disabled',
        icon: game.icon,
        title: game.title,
        description: game.description,
        badge: game.available ? 'Jouer' : 'Bientôt',
        leaderboardButton: renderLeaderboardButton(game),
    }, ['leaderboardButton']);
}

export function renderHomeMenuTemplate(): string {
    return fillTemplate(menuHtml, {
        games: games.map(renderGameCard).join(''),
    }, ['games']);
}

export function initHomeMenu(root: HTMLElement): void {
    mountTemplate(root, renderHomeMenuTemplate());

    root.querySelectorAll<HTMLButtonElement>('.arcade-podium-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const gameId = button.dataset.gameId;

            if (gameId) {
                void openLeaderboardModal(gameId);
            }
        });
    });
}
