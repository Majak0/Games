import { handValue, isBlackjack, isMaximumTwentyOne, suitClass, suitSymbol, type Card } from './deck';

type ScoreTone = 'default' | 'twenty-one' | 'bust';

export function formatMoney(amount: number): string {
    return `${amount} $`;
}

function scoreTone(total: number): ScoreTone {
    if (total > 21) {
        return 'bust';
    }

    if (total === 21) {
        return 'twenty-one';
    }

    return 'default';
}

function applyScoreStyle(element: HTMLElement, tone: ScoreTone): void {
    element.classList.remove(
        'arcade-blackjack-hand__score--twenty-one',
        'arcade-blackjack-hand__score--bust',
    );

    if (tone === 'twenty-one') {
        element.classList.add('arcade-blackjack-hand__score--twenty-one');
    } else if (tone === 'bust') {
        element.classList.add('arcade-blackjack-hand__score--bust');
    }
}

function renderCard(card: Card, hidden = false, animate = false): string {
    const animateClass = animate ? ' arcade-card--deal-in' : '';

    if (hidden) {
        return `
            <div class="arcade-card arcade-card--hidden${animateClass}" aria-label="Carte cachée">
                <span class="arcade-card__back">?</span>
            </div>`;
    }

    return `
        <div class="arcade-card ${suitClass(card.suit)}${animateClass}" aria-label="${card.rank} de ${card.suit}">
            <span class="arcade-card__rank">${card.rank}</span>
            <span class="arcade-card__suit">${suitSymbol(card.suit)}</span>
        </div>`;
}

function renderHand(
    container: HTMLElement,
    cards: Card[],
    hideSecondDealerCard: boolean,
    animateIndex?: number,
): void {
    container.innerHTML = cards
        .map((card, index) => renderCard(
            card,
            hideSecondDealerCard && index === 1,
            index === animateIndex,
        ))
        .join('');
}

export interface TableElements {
    playerCards: HTMLElement;
    dealerCards: HTMLElement;
    playerScore: HTMLElement;
    dealerScore: HTMLElement;
    playerBlackjackTag: HTMLElement;
    dealerBlackjackTag: HTMLElement;
    playerMaxTag: HTMLElement;
    dealerMaxTag: HTMLElement;
}

export interface TableViewModel {
    playerHand: Card[];
    dealerHand: Card[];
    dealerHoleHidden: boolean;
}

export function renderTable(
    elements: TableElements,
    view: TableViewModel,
    animateHand?: 'player' | 'dealer',
): void {
    const playerAnimateIndex = animateHand === 'player'
        ? view.playerHand.length - 1
        : undefined;
    const dealerAnimateIndex = animateHand === 'dealer'
        ? view.dealerHand.length - 1
        : undefined;

    renderHand(elements.playerCards, view.playerHand, false, playerAnimateIndex);
    renderHand(elements.dealerCards, view.dealerHand, view.dealerHoleHidden, dealerAnimateIndex);

    if (view.playerHand.length === 0) {
        elements.playerScore.textContent = '—';
        applyScoreStyle(elements.playerScore, 'default');
    } else {
        const playerTotal = handValue(view.playerHand);
        elements.playerScore.textContent = String(playerTotal);
        applyScoreStyle(elements.playerScore, scoreTone(playerTotal));
    }

    if (view.dealerHand.length === 0) {
        elements.dealerScore.textContent = '—';
        applyScoreStyle(elements.dealerScore, 'default');
    } else if (view.dealerHoleHidden && view.dealerHand.length >= 2) {
        const visibleDealerTotal = handValue([view.dealerHand[0]]);
        elements.dealerScore.textContent = String(visibleDealerTotal);
        applyScoreStyle(elements.dealerScore, scoreTone(visibleDealerTotal));
    } else {
        const dealerTotal = handValue(view.dealerHand);
        elements.dealerScore.textContent = String(dealerTotal);
        applyScoreStyle(elements.dealerScore, scoreTone(dealerTotal));
    }

    const playerBlackjack = isBlackjack(view.playerHand);
    const dealerBlackjack = isBlackjack(view.dealerHand);
    const playerMaximum = isMaximumTwentyOne(view.playerHand);
    const dealerMaximum = !view.dealerHoleHidden && isMaximumTwentyOne(view.dealerHand);

    elements.playerBlackjackTag.hidden = !playerBlackjack;
    elements.playerMaxTag.hidden = !playerMaximum;
    elements.dealerBlackjackTag.hidden = view.dealerHoleHidden || !dealerBlackjack;
    elements.dealerMaxTag.hidden = view.dealerHoleHidden || !dealerMaximum;
}
