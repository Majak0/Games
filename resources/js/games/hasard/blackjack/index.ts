import { mountTemplate } from '@/games/shared/template';
import {
    fetchSavedBestStreak,
    saveBestStreakIfImproved,
} from '@/scores/saveBestStreak';
import {
    type Card,
    createDeck,
    drawCard,
    handValue,
    isBlackjack,
    shuffleDeck,
    suitClass,
    suitSymbol,
} from './deck';
import gameScreenHtml from './templates/html/gameScreen.html?raw';

type RoundPhase = 'idle' | 'player' | 'dealer' | 'finished';

interface BlackjackState {
    deck: Card[];
    playerHand: Card[];
    dealerHand: Card[];
    wins: number;
    losses: number;
    streak: number;
    bestStreak: number;
    savedBestStreak: number;
    phase: RoundPhase;
    dealerHoleHidden: boolean;
}

function renderCard(card: Card, hidden = false): string {
    if (hidden) {
        return `
            <div class="arcade-card arcade-card--hidden" aria-label="Carte cachée">
                <span class="arcade-card__back">?</span>
            </div>`;
    }

    return `
        <div class="arcade-card ${suitClass(card.suit)}" aria-label="${card.rank} de ${card.suit}">
            <span class="arcade-card__rank">${card.rank}</span>
            <span class="arcade-card__suit">${suitSymbol(card.suit)}</span>
        </div>`;
}

function renderHand(container: HTMLElement, cards: Card[], hideSecondDealerCard: boolean): void {
    container.innerHTML = cards
        .map((card, index) => renderCard(card, hideSecondDealerCard && index === 1))
        .join('');
}

export function initBlackjack(root: HTMLElement): void {
    mountTemplate(root, gameScreenHtml);

    const winsEl = root.querySelector<HTMLElement>('#wins');
    const lossesEl = root.querySelector<HTMLElement>('#losses');
    const bestStreakEl = root.querySelector<HTMLElement>('#best-streak');
    const dealerScoreEl = root.querySelector<HTMLElement>('#dealer-score');
    const playerScoreEl = root.querySelector<HTMLElement>('#player-score');
    const dealerBlackjackTag = root.querySelector<HTMLElement>('#dealer-blackjack-tag');
    const playerBlackjackTag = root.querySelector<HTMLElement>('#player-blackjack-tag');
    const dealerCardsEl = root.querySelector<HTMLElement>('#dealer-cards');
    const playerCardsEl = root.querySelector<HTMLElement>('#player-cards');
    const messageEl = root.querySelector<HTMLElement>('#message');
    const btnHit = root.querySelector<HTMLButtonElement>('#btn-hit');
    const btnStand = root.querySelector<HTMLButtonElement>('#btn-stand');
    const btnNew = root.querySelector<HTMLButtonElement>('#btn-new');

    if (
        !winsEl
        || !lossesEl
        || !bestStreakEl
        || !dealerScoreEl
        || !playerScoreEl
        || !dealerBlackjackTag
        || !playerBlackjackTag
        || !dealerCardsEl
        || !playerCardsEl
        || !messageEl
        || !btnHit
        || !btnStand
        || !btnNew
    ) {
        return;
    }

    const state: BlackjackState = {
        deck: [],
        playerHand: [],
        dealerHand: [],
        wins: 0,
        losses: 0,
        streak: 0,
        bestStreak: 0,
        savedBestStreak: 0,
        phase: 'idle',
        dealerHoleHidden: false,
    };

    function updateStats(): void {
        winsEl.textContent = String(state.wins);
        lossesEl.textContent = String(state.losses);
        bestStreakEl.textContent = String(state.bestStreak);
    }

    function recordWin(): void {
        state.wins += 1;
        state.streak += 1;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        updateStats();
        void persistBestStreak();
    }

    async function persistBestStreak(): Promise<void> {
        state.savedBestStreak = await saveBestStreakIfImproved(
            'blackjack',
            state.bestStreak,
            state.savedBestStreak
        );
    }

    function recordLoss(): void {
        state.losses += 1;
        state.streak = 0;
        updateStats();
    }

    function setMessage(text: string, tone: 'neutral' | 'win' | 'lose' = 'neutral'): void {
        messageEl.textContent = text;
        messageEl.className = `arcade-blackjack-message arcade-blackjack-message--${tone}`;
    }

    function updateBlackjackTags(): void {
        const playerTotal = state.playerHand.length > 0 ? handValue(state.playerHand) : 0;
        const dealerTotal = state.dealerHand.length > 0 ? handValue(state.dealerHand) : 0;

        playerBlackjackTag.hidden = playerTotal !== 21;
        dealerBlackjackTag.hidden = state.dealerHoleHidden || dealerTotal !== 21;
    }

    function updateScores(): void {
        playerScoreEl.textContent = state.playerHand.length > 0
            ? String(handValue(state.playerHand))
            : '—';

        if (state.dealerHand.length === 0) {
            dealerScoreEl.textContent = '—';
            updateBlackjackTags();
            return;
        }

        if (state.dealerHoleHidden && state.dealerHand.length >= 2) {
            dealerScoreEl.textContent = String(handValue([state.dealerHand[0]]));
            updateBlackjackTags();
            return;
        }

        dealerScoreEl.textContent = String(handValue(state.dealerHand));
        updateBlackjackTags();
    }

    function renderTable(): void {
        renderHand(playerCardsEl, state.playerHand, false);
        renderHand(dealerCardsEl, state.dealerHand, state.dealerHoleHidden);
        updateScores();
    }

    function setActionState(): void {
        const canPlay = state.phase === 'player';
        btnHit.disabled = !canPlay;
        btnStand.disabled = !canPlay;
        btnNew.disabled = state.phase === 'player' || state.phase === 'dealer';
    }

    function finishRound(outcome: 'win' | 'lose' | 'push', detail: string): void {
        state.phase = 'finished';
        state.dealerHoleHidden = false;
        renderTable();

        if (outcome === 'win') {
            recordWin();
            setMessage(`${detail} Vous gagnez.`, 'win');
        } else if (outcome === 'lose') {
            recordLoss();
            setMessage(`${detail} Vous perdez.`, 'lose');
        } else {
            setMessage(`${detail} Égalité.`, 'neutral');
        }

        setActionState();
    }

    function dealerTurn(): void {
        state.phase = 'dealer';
        state.dealerHoleHidden = false;
        renderTable();
        setActionState();

        const step = (): void => {
            const dealerTotal = handValue(state.dealerHand);

            if (dealerTotal < 17) {
                const card = drawCard(state.deck);

                if (!card) {
                    finishRound('push', 'Plus de cartes.');
                    return;
                }

                state.dealerHand.push(card);
                renderTable();
                window.setTimeout(step, 450);
                return;
            }

            const playerTotal = handValue(state.playerHand);
            const finalDealer = handValue(state.dealerHand);

            if (finalDealer > 21) {
                finishRound('win', 'Le croupier dépasse 21.');
            } else if (playerTotal > finalDealer) {
                finishRound('win', 'Vous battez le croupier.');
            } else if (playerTotal < finalDealer) {
                finishRound('lose', 'Le croupier l\'emporte.');
            } else {
                finishRound('push', 'Main nulle.');
            }
        };

        window.setTimeout(step, 450);
    }

    function checkPlayerBust(): void {
        const total = handValue(state.playerHand);

        if (total > 21) {
            state.dealerHoleHidden = false;
            finishRound('lose', 'Vous dépassez 21.');
        }
    }

    function startRound(): void {
        state.deck = shuffleDeck(createDeck());
        state.playerHand = [];
        state.dealerHand = [];
        state.dealerHoleHidden = true;
        state.phase = 'player';
        setMessage('');
        setActionState();

        for (let draw = 0; draw < 2; draw += 1) {
            const playerCard = drawCard(state.deck);
            const dealerCard = drawCard(state.deck);

            if (!playerCard || !dealerCard) {
                setMessage('Erreur de distribution.', 'lose');
                return;
            }

            state.playerHand.push(playerCard);
            state.dealerHand.push(dealerCard);
        }

        renderTable();

        if (isBlackjack(state.playerHand) && isBlackjack(state.dealerHand)) {
            finishRound('push', 'Blackjack des deux côtés.');
            return;
        }

        if (isBlackjack(state.playerHand)) {
            finishRound('win', 'Blackjack !');
            return;
        }

        if (isBlackjack(state.dealerHand)) {
            state.dealerHoleHidden = false;
            renderTable();
            finishRound('lose', 'Blackjack du croupier.');
        }
    }

    btnHit.addEventListener('click', () => {
        if (state.phase !== 'player') {
            return;
        }

        const card = drawCard(state.deck);

        if (!card) {
            return;
        }

        state.playerHand.push(card);
        renderTable();
        checkPlayerBust();
    });

    btnStand.addEventListener('click', () => {
        if (state.phase !== 'player') {
            return;
        }

        dealerTurn();
    });

    btnNew.addEventListener('click', () => {
        if (state.phase === 'player' || state.phase === 'dealer') {
            return;
        }

        startRound();
    });

    updateStats();
    setActionState();
    renderTable();

    void fetchSavedBestStreak('blackjack').then((saved) => {
        state.savedBestStreak = saved;
        state.bestStreak = Math.max(state.bestStreak, saved);
        updateStats();
    });
}
