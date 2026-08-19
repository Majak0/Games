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
    isMaximumTwentyOne,
    shuffleDeck,
    suitClass,
    suitSymbol,
} from './deck';
import {
    type BankrollStatus,
    claimDailyBonus,
    DAILY_BONUS_AMOUNT,
    fetchBankrollStatus,
    saveBankroll,
    STARTING_BANKROLL,
} from './bankroll';
import gameScreenHtml from './templates/html/gameScreen.html?raw';

type RoundPhase = 'idle' | 'dealing' | 'player' | 'dealer' | 'finished';

const CARD_DEAL_DELAY_MS = 400;
const DEALER_DRAW_DELAY_MS = 650;
const PLAYER_TO_DEALER_DELAY_MS = 700;
const DEFAULT_BET = 5;

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
    bankroll: number;
    roundBet: number;
    bankrollPersistenceEnabled: boolean;
    canClaimDailyBonus: boolean;
    dailyBonusAmount: number;
}

type WinPayout = 'standard' | 'blackjack';

function blackjackProfit(bet: number): number {
    return Math.floor((bet * 3) / 2);
}

function formatMoney(amount: number): string {
    return `${amount} $`;
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

type ScoreTone = 'default' | 'twenty-one' | 'bust';

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

export function initBlackjack(root: HTMLElement): void {
    mountTemplate(root, gameScreenHtml);

    const winsEl = root.querySelector<HTMLElement>('#wins');
    const lossesEl = root.querySelector<HTMLElement>('#losses');
    const bestStreakEl = root.querySelector<HTMLElement>('#best-streak');
    const dealerScoreEl = root.querySelector<HTMLElement>('#dealer-score');
    const playerScoreEl = root.querySelector<HTMLElement>('#player-score');
    const dealerBlackjackTag = root.querySelector<HTMLElement>('#dealer-blackjack-tag');
    const playerBlackjackTag = root.querySelector<HTMLElement>('#player-blackjack-tag');
    const dealerMaxTag = root.querySelector<HTMLElement>('#dealer-max-tag');
    const playerMaxTag = root.querySelector<HTMLElement>('#player-max-tag');
    const dealerCardsEl = root.querySelector<HTMLElement>('#dealer-cards');
    const playerCardsEl = root.querySelector<HTMLElement>('#player-cards');
    const messageEl = root.querySelector<HTMLElement>('#message');
    const btnHit = root.querySelector<HTMLButtonElement>('#btn-hit');
    const btnStand = root.querySelector<HTMLButtonElement>('#btn-stand');
    const btnNew = root.querySelector<HTMLButtonElement>('#btn-new');
    const btnHelp = root.querySelector<HTMLButtonElement>('#btn-help');
    const helpModal = root.querySelector<HTMLElement>('#blackjack-help-modal');
    const bankrollEl = root.querySelector<HTMLElement>('#bankroll');
    const betAmountInput = root.querySelector<HTMLInputElement>('#bet-amount');
    const btnBetUp = root.querySelector<HTMLButtonElement>('#btn-bet-up');
    const btnBetDown = root.querySelector<HTMLButtonElement>('#btn-bet-down');
    const dailyModal = root.querySelector<HTMLElement>('#blackjack-daily-modal');
    const dailyMessageEl = root.querySelector<HTMLElement>('#blackjack-daily-message');
    const btnClaimDaily = root.querySelector<HTMLButtonElement>('#btn-claim-daily');

    if (
        !winsEl
        || !lossesEl
        || !bestStreakEl
        || !dealerScoreEl
        || !playerScoreEl
        || !dealerBlackjackTag
        || !playerBlackjackTag
        || !dealerMaxTag
        || !playerMaxTag
        || !dealerCardsEl
        || !playerCardsEl
        || !messageEl
        || !btnHit
        || !btnStand
        || !btnNew
        || !btnHelp
        || !helpModal
        || !bankrollEl
        || !betAmountInput
        || !btnBetUp
        || !btnBetDown
        || !dailyModal
        || !dailyMessageEl
        || !btnClaimDaily
    ) {
        return;
    }

    function onDailyModalKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            closeDailyModal();
        }
    }

    function openDailyModal(): void {
        const bonusAmount = state.dailyBonusAmount || DAILY_BONUS_AMOUNT;

        if (state.canClaimDailyBonus) {
            dailyMessageEl.textContent = `Vos jetons quotidiens sont disponibles ! Récupérez ${formatMoney(bonusAmount)} pour rejouer.`;
            btnClaimDaily.hidden = false;
            btnClaimDaily.textContent = `Récupérer ${formatMoney(bonusAmount)}`;
        } else {
            dailyMessageEl.textContent = `Vous n'avez plus de jetons. Revenez demain pour récupérer ${formatMoney(bonusAmount)} de jetons gratuits.`;
            btnClaimDaily.hidden = true;
        }

        dailyModal.hidden = false;
        dailyModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('arcade-modal-open');
        window.addEventListener('keydown', onDailyModalKeydown);
    }

    function closeDailyModal(): void {
        dailyModal.hidden = true;
        dailyModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('arcade-modal-open');
        window.removeEventListener('keydown', onDailyModalKeydown);
    }

    function maybeShowDailyModal(): void {
        if (!state.bankrollPersistenceEnabled || state.bankroll !== 0) {
            return;
        }

        openDailyModal();
    }

    dailyModal.querySelectorAll('[data-close-daily-modal]').forEach((element) => {
        element.addEventListener('click', () => {
            closeDailyModal();
        });
    });

    btnClaimDaily.addEventListener('click', () => {
        void claimDailyBonus().then((status) => {
            if (!status) {
                return;
            }

            applyBankrollStatus(status);
            closeDailyModal();
        });
    });

    function openHelpModal(): void {
        helpModal.hidden = false;
        helpModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('arcade-modal-open');
        window.addEventListener('keydown', onHelpModalKeydown);
    }

    function closeHelpModal(): void {
        helpModal.hidden = true;
        helpModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('arcade-modal-open');
        window.removeEventListener('keydown', onHelpModalKeydown);
    }

    function onHelpModalKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            closeHelpModal();
        }
    }

    btnHelp.addEventListener('click', () => {
        openHelpModal();
    });

    helpModal.querySelectorAll('[data-close-help-modal]').forEach((element) => {
        element.addEventListener('click', () => {
            closeHelpModal();
        });
    });

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
        bankroll: STARTING_BANKROLL,
        roundBet: 0,
        bankrollPersistenceEnabled: false,
        canClaimDailyBonus: false,
        dailyBonusAmount: DAILY_BONUS_AMOUNT,
    };

    function applyBankrollStatus(status: BankrollStatus): void {
        state.bankroll = status.bankroll;
        state.canClaimDailyBonus = status.canClaimDailyBonus;
        state.dailyBonusAmount = status.dailyBonusAmount;
        updateBankrollUI();
        setActionState();
    }

    async function persistBankroll(): Promise<void> {
        if (!state.bankrollPersistenceEnabled) {
            return;
        }

        const status = await saveBankroll(state.bankroll);

        if (status !== null) {
            applyBankrollStatus(status);
        }
    }

    function updateBankrollUI(): void {
        bankrollEl.textContent = formatMoney(state.bankroll);

        const selectedBet = getSelectedBet();

        if (selectedBet !== Number(betAmountInput.value)) {
            betAmountInput.value = String(selectedBet);
        }

        btnBetUp.disabled = betAmountInput.disabled || selectedBet >= state.bankroll;
        btnBetDown.disabled = betAmountInput.disabled || selectedBet <= 1;
    }

    function setBetAmount(amount: number): void {
        betAmountInput.value = String(Math.max(1, Math.min(amount, state.bankroll)));
        updateBankrollUI();
        setActionState();
    }

    function adjustBet(delta: number): void {
        setBetAmount(getSelectedBet() + delta);
    }

    function getSelectedBet(): number {
        const parsed = Number.parseInt(betAmountInput.value, 10);

        if (!Number.isFinite(parsed) || parsed < 1) {
            return Math.min(1, state.bankroll);
        }

        return Math.min(parsed, state.bankroll);
    }

    function canPlaceBet(): boolean {
        return state.bankroll >= 1 && getSelectedBet() >= 1;
    }

    function lockBetForRound(): boolean {
        const bet = getSelectedBet();

        if (bet < 1 || bet > state.bankroll) {
            setMessage('Mise invalide.', 'lose');
            return false;
        }

        state.roundBet = bet;
        state.bankroll -= bet;
        updateBankrollUI();
        void persistBankroll();
        return true;
    }

    function settleBet(outcome: 'win' | 'lose' | 'push', winPayout: WinPayout = 'standard'): string {
        if (state.roundBet <= 0) {
            return '';
        }

        if (outcome === 'win') {
            if (winPayout === 'blackjack') {
                const profit = blackjackProfit(state.roundBet);
                state.bankroll += state.roundBet + profit;
                updateBankrollUI();
                return ` (+${formatMoney(profit)})`;
            }

            state.bankroll += state.roundBet * 2;
            updateBankrollUI();
            return ` (+${formatMoney(state.roundBet)})`;
        }

        if (outcome === 'push') {
            state.bankroll += state.roundBet;
            updateBankrollUI();
            return ' (mise rendue)';
        }

        updateBankrollUI();
        return ` (-${formatMoney(state.roundBet)})`;
    }

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

    function updateHandTags(): void {
        const playerBlackjack = isBlackjack(state.playerHand);
        const dealerBlackjack = isBlackjack(state.dealerHand);
        const playerMaximum = isMaximumTwentyOne(state.playerHand);
        const dealerMaximum = !state.dealerHoleHidden && isMaximumTwentyOne(state.dealerHand);

        playerBlackjackTag.hidden = !playerBlackjack;
        playerMaxTag.hidden = !playerMaximum;
        dealerBlackjackTag.hidden = state.dealerHoleHidden || !dealerBlackjack;
        dealerMaxTag.hidden = state.dealerHoleHidden || !dealerMaximum;
    }

    function updateScores(): void {
        if (state.playerHand.length === 0) {
            playerScoreEl.textContent = '—';
            applyScoreStyle(playerScoreEl, 'default');
        } else {
            const playerTotal = handValue(state.playerHand);
            playerScoreEl.textContent = String(playerTotal);
            applyScoreStyle(playerScoreEl, scoreTone(playerTotal));
        }

        if (state.dealerHand.length === 0) {
            dealerScoreEl.textContent = '—';
            applyScoreStyle(dealerScoreEl, 'default');
            updateHandTags();
            return;
        }

        if (state.dealerHoleHidden && state.dealerHand.length >= 2) {
            const visibleDealerTotal = handValue([state.dealerHand[0]]);
            dealerScoreEl.textContent = String(visibleDealerTotal);
            applyScoreStyle(dealerScoreEl, scoreTone(visibleDealerTotal));
            updateHandTags();
            return;
        }

        const dealerTotal = handValue(state.dealerHand);
        dealerScoreEl.textContent = String(dealerTotal);
        applyScoreStyle(dealerScoreEl, scoreTone(dealerTotal));
        updateHandTags();
    }

    function renderTable(animateHand?: 'player' | 'dealer'): void {
        const playerAnimateIndex = animateHand === 'player'
            ? state.playerHand.length - 1
            : undefined;
        const dealerAnimateIndex = animateHand === 'dealer'
            ? state.dealerHand.length - 1
            : undefined;

        renderHand(playerCardsEl, state.playerHand, false, playerAnimateIndex);
        renderHand(dealerCardsEl, state.dealerHand, state.dealerHoleHidden, dealerAnimateIndex);
        updateScores();
    }

    function setActionState(): void {
        const canPlay = state.phase === 'player'
            && !isMaximumTwentyOne(state.playerHand);
        const canBet = state.phase === 'idle' || state.phase === 'finished';
        btnHit.disabled = !canPlay;
        btnStand.disabled = !canPlay;
        btnNew.disabled = !canBet || !canPlaceBet();
        betAmountInput.disabled = !canBet;
        updateBankrollUI();
    }

    function finishRound(
        outcome: 'win' | 'lose' | 'push',
        detail: string,
        options: { revealDealerHole?: boolean; winPayout?: WinPayout } = {},
    ): void {
        state.phase = 'finished';

        if (options.revealDealerHole ?? true) {
            state.dealerHoleHidden = false;
        }

        renderTable();

        const payoutDetail = settleBet(outcome, options.winPayout ?? 'standard');

        if (outcome === 'win') {
            recordWin();
            setMessage(`${detail} Vous gagnez${payoutDetail}.`, 'win');
        } else if (outcome === 'lose') {
            recordLoss();
            setMessage(`${detail} Vous perdez${payoutDetail}.`, 'lose');
        } else {
            setMessage(`${detail} Égalité${payoutDetail}.`, 'neutral');
        }

        void persistBankroll().then(() => {
            maybeShowDailyModal();
        });
        setActionState();
    }

    function beginDealerTurn(): void {
        if (state.phase !== 'player') {
            return;
        }

        btnHit.disabled = true;
        btnStand.disabled = true;

        window.setTimeout(() => {
            if (state.phase === 'player') {
                dealerTurn();
            }
        }, PLAYER_TO_DEALER_DELAY_MS);
    }

    function dealerTurn(): void {
        state.phase = 'dealer';
        state.dealerHoleHidden = false;
        renderTable('dealer');
        setActionState();

        window.setTimeout(() => {
            if (resolveDealerBlackjackIfNeeded()) {
                return;
            }

            const step = (): void => {
                const dealerTotal = handValue(state.dealerHand);

                if (dealerTotal < 17) {
                    const card = drawCard(state.deck);

                    if (!card) {
                        finishRound('push', 'Plus de cartes.');
                        return;
                    }

                    state.dealerHand.push(card);
                    renderTable('dealer');
                    window.setTimeout(step, DEALER_DRAW_DELAY_MS);
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
                    finishRound('push', 'Scores égaux.');
                }
            };

            step();
        }, DEALER_DRAW_DELAY_MS);
    }

    function resolveInitialBlackjack(): void {
        if (!isBlackjack(state.playerHand)) {
            return;
        }

        if (isBlackjack(state.dealerHand)) {
            finishRound('push', 'Blackjack des deux côtés.');
            return;
        }

        finishRound('win', 'Blackjack !', {
            revealDealerHole: false,
            winPayout: 'blackjack',
        });
    }

    function resolveDealerBlackjackIfNeeded(): boolean {
        if (!isBlackjack(state.dealerHand)) {
            return false;
        }

        if (isBlackjack(state.playerHand)) {
            finishRound('push', 'Blackjack des deux côtés.');
        } else {
            finishRound('lose', 'Blackjack du croupier.');
        }

        return true;
    }

    function dealInitialCard(step: number): void {
        const isPlayerTurn = step % 2 === 0;
        const card = drawCard(state.deck);

        if (!card) {
            state.phase = 'finished';
            setMessage('Erreur de distribution.', 'lose');
            setActionState();
            return;
        }

        if (isPlayerTurn) {
            state.playerHand.push(card);
        } else {
            state.dealerHand.push(card);
        }

        renderTable(isPlayerTurn ? 'player' : 'dealer');

        if (step >= 3) {
            state.phase = 'player';
            setActionState();
            window.setTimeout(resolveInitialBlackjack, CARD_DEAL_DELAY_MS);
            return;
        }

        window.setTimeout(() => dealInitialCard(step + 1), CARD_DEAL_DELAY_MS);
    }

    function startRound(): void {
        if (!lockBetForRound()) {
            setActionState();
            return;
        }

        state.deck = shuffleDeck(createDeck());
        state.playerHand = [];
        state.dealerHand = [];
        state.dealerHoleHidden = true;
        state.phase = 'dealing';
        setMessage('');
        setActionState();
        renderTable();

        window.setTimeout(() => dealInitialCard(0), CARD_DEAL_DELAY_MS);
    }

    function checkPlayerTwentyOne(): void {
        if (state.phase !== 'player' || !isMaximumTwentyOne(state.playerHand)) {
            return;
        }

        beginDealerTurn();
    }

    function checkPlayerBust(): void {
        const total = handValue(state.playerHand);

        if (total > 21) {
            finishRound('lose', 'Vous dépassez 21.', { revealDealerHole: false });
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
        renderTable('player');
        checkPlayerBust();
        checkPlayerTwentyOne();
    });

    btnStand.addEventListener('click', () => {
        if (state.phase !== 'player') {
            return;
        }

        beginDealerTurn();
    });

    btnNew.addEventListener('click', () => {
        if (state.phase === 'player' || state.phase === 'dealer' || state.phase === 'dealing') {
            return;
        }

        startRound();
    });

    betAmountInput.addEventListener('input', () => {
        betAmountInput.value = betAmountInput.value.replace(/\D/g, '');
        betAmountInput.value = String(getSelectedBet());
        updateBankrollUI();
        setActionState();
    });

    betAmountInput.addEventListener('blur', () => {
        setBetAmount(getSelectedBet());
    });

    btnBetUp.addEventListener('click', () => {
        adjustBet(1);
    });

    btnBetDown.addEventListener('click', () => {
        adjustBet(-1);
    });

    updateStats();
    updateBankrollUI();
    setActionState();
    renderTable();

    void fetchBankrollStatus().then((status) => {
        if (status === null) {
            return;
        }

        state.bankrollPersistenceEnabled = true;
        applyBankrollStatus(status);
        maybeShowDailyModal();
    });

    void fetchSavedBestStreak('blackjack').then((saved) => {
        state.savedBestStreak = saved;
        state.bestStreak = Math.max(state.bestStreak, saved);
        updateStats();
    });
}
