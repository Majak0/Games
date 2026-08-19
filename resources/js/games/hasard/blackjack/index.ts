import { bindElements } from '@/shared/bindElements';
import { createModalController } from '@/shared/modal';
import { mountTemplate } from '@/games/shared/template';
import { createStreakTracker } from '@/games/hasard/streakTracker';
import {
    type Card,
    createDeck,
    drawCard,
    handValue,
    isBlackjack,
    isMaximumTwentyOne,
    shuffleDeck,
} from './deck';
import {
    clampBet,
    settleBetAmount,
    type WinPayout,
} from './betting';
import {
    type BankrollStatus,
    claimDailyBonus,
    DAILY_BONUS_AMOUNT,
    fetchBankrollStatus,
    saveBankroll,
    STARTING_BANKROLL,
} from './bankroll';
import { formatMoney, renderTable, type TableElements } from './ui';
import gameScreenHtml from './templates/html/gameScreen.html?raw';

type RoundPhase = 'idle' | 'dealing' | 'player' | 'dealer' | 'finished';

const CARD_DEAL_DELAY_MS = 400;
const DEALER_DRAW_DELAY_MS = 650;
const PLAYER_TO_DEALER_DELAY_MS = 700;

interface BlackjackState {
    deck: Card[];
    playerHand: Card[];
    dealerHand: Card[];
    phase: RoundPhase;
    dealerHoleHidden: boolean;
    bankroll: number;
    roundBet: number;
    bankrollPersistenceEnabled: boolean;
    canClaimDailyBonus: boolean;
    dailyBonusAmount: number;
}

export function initBlackjack(root: HTMLElement): void {
    mountTemplate(root, gameScreenHtml);

    const elements = bindElements(root, {
        wins: '#wins',
        losses: '#losses',
        bestStreak: '#best-streak',
        dealerScore: '#dealer-score',
        playerScore: '#player-score',
        dealerBlackjackTag: '#dealer-blackjack-tag',
        playerBlackjackTag: '#player-blackjack-tag',
        dealerMaxTag: '#dealer-max-tag',
        playerMaxTag: '#player-max-tag',
        dealerCards: '#dealer-cards',
        playerCards: '#player-cards',
        message: '#message',
        btnHit: '#btn-hit',
        btnStand: '#btn-stand',
        btnNew: '#btn-new',
        btnHelp: '#btn-help',
        helpModal: '#blackjack-help-modal',
        bankroll: '#bankroll',
        betAmount: '#bet-amount',
        btnBetUp: '#btn-bet-up',
        btnBetDown: '#btn-bet-down',
        dailyModal: '#blackjack-daily-modal',
        dailyMessage: '#blackjack-daily-message',
        btnClaimDaily: '#btn-claim-daily',
    });

    if (!elements) {
        return;
    }

    const tableElements: TableElements = {
        playerCards: elements.playerCards,
        dealerCards: elements.dealerCards,
        playerScore: elements.playerScore,
        dealerScore: elements.dealerScore,
        playerBlackjackTag: elements.playerBlackjackTag,
        dealerBlackjackTag: elements.dealerBlackjackTag,
        playerMaxTag: elements.playerMaxTag,
        dealerMaxTag: elements.dealerMaxTag,
    };

    const btnHit = elements.btnHit as HTMLButtonElement;
    const btnStand = elements.btnStand as HTMLButtonElement;
    const btnNew = elements.btnNew as HTMLButtonElement;
    const btnHelp = elements.btnHelp as HTMLButtonElement;
    const betAmountInput = elements.betAmount as HTMLInputElement;
    const btnBetUp = elements.btnBetUp as HTMLButtonElement;
    const btnBetDown = elements.btnBetDown as HTMLButtonElement;
    const btnClaimDaily = elements.btnClaimDaily as HTMLButtonElement;

    const helpModal = createModalController(elements.helpModal);
    helpModal.bindCloseTriggers('[data-close-help-modal]');
    btnHelp.addEventListener('click', () => helpModal.open());

    const dailyModal = createModalController(elements.dailyModal);
    dailyModal.bindCloseTriggers('[data-close-daily-modal]');

    const streak = createStreakTracker('blackjack', {
        wins: elements.wins,
        losses: elements.losses,
        bestStreak: elements.bestStreak,
    });

    const state: BlackjackState = {
        deck: [],
        playerHand: [],
        dealerHand: [],
        phase: 'idle',
        dealerHoleHidden: false,
        bankroll: STARTING_BANKROLL,
        roundBet: 0,
        bankrollPersistenceEnabled: false,
        canClaimDailyBonus: false,
        dailyBonusAmount: DAILY_BONUS_AMOUNT,
    };

    function tableView(): { playerHand: Card[]; dealerHand: Card[]; dealerHoleHidden: boolean } {
        return {
            playerHand: state.playerHand,
            dealerHand: state.dealerHand,
            dealerHoleHidden: state.dealerHoleHidden,
        };
    }

    function drawTable(animateHand?: 'player' | 'dealer'): void {
        renderTable(tableElements, tableView(), animateHand);
    }

    function setMessage(text: string, tone: 'neutral' | 'win' | 'lose' = 'neutral'): void {
        elements.message.textContent = text;
        elements.message.className = `arcade-blackjack-message arcade-blackjack-message--${tone}`;
    }

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
        elements.bankroll.textContent = formatMoney(state.bankroll);

        const selectedBet = getSelectedBet();

        if (selectedBet !== Number(betAmountInput.value)) {
            betAmountInput.value = String(selectedBet);
        }

        btnBetUp.disabled = betAmountInput.disabled || selectedBet >= state.bankroll;
        btnBetDown.disabled = betAmountInput.disabled || selectedBet <= 1;
    }

    function getSelectedBet(): number {
        return clampBet(betAmountInput.value, state.bankroll);
    }

    function canPlaceBet(): boolean {
        return state.bankroll >= 1 && getSelectedBet() >= 1;
    }

    function setBetAmount(amount: number): void {
        betAmountInput.value = String(Math.max(1, Math.min(amount, state.bankroll)));
        updateBankrollUI();
        setActionState();
    }

    function openDailyModal(): void {
        const bonusAmount = state.dailyBonusAmount || DAILY_BONUS_AMOUNT;

        if (state.canClaimDailyBonus) {
            elements.dailyMessage.textContent = `Vos jetons quotidiens sont disponibles ! Récupérez ${formatMoney(bonusAmount)} pour rejouer.`;
            btnClaimDaily.hidden = false;
            btnClaimDaily.textContent = `Récupérer ${formatMoney(bonusAmount)}`;
        } else {
            elements.dailyMessage.textContent = `Vous n'avez plus de jetons. Revenez demain pour récupérer ${formatMoney(bonusAmount)} de jetons gratuits.`;
            btnClaimDaily.hidden = true;
        }

        dailyModal.open();
    }

    function maybeShowDailyModal(): void {
        if (state.bankrollPersistenceEnabled && state.bankroll === 0) {
            openDailyModal();
        }
    }

    btnClaimDaily.addEventListener('click', () => {
        void claimDailyBonus().then((status) => {
            if (!status) {
                return;
            }

            applyBankrollStatus(status);
            dailyModal.close();
        });
    });

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

    function finishRound(
        outcome: 'win' | 'lose' | 'push',
        detail: string,
        options: { revealDealerHole?: boolean; winPayout?: WinPayout } = {},
    ): void {
        state.phase = 'finished';

        if (options.revealDealerHole ?? true) {
            state.dealerHoleHidden = false;
        }

        drawTable();

        const settlement = settleBetAmount(
            state.roundBet,
            outcome,
            options.winPayout ?? 'standard',
        );
        state.bankroll += settlement.bankrollDelta;
        updateBankrollUI();

        if (outcome === 'win') {
            streak.recordWin();
            setMessage(`${detail} Vous gagnez${settlement.detail}.`, 'win');
        } else if (outcome === 'lose') {
            streak.recordLoss();
            setMessage(`${detail} Vous perdez${settlement.detail}.`, 'lose');
        } else {
            setMessage(`${detail} Égalité${settlement.detail}.`, 'neutral');
        }

        void persistBankroll().then(maybeShowDailyModal);
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
        drawTable('dealer');
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
                    drawTable('dealer');
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

        drawTable(isPlayerTurn ? 'player' : 'dealer');

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
        drawTable();

        window.setTimeout(() => dealInitialCard(0), CARD_DEAL_DELAY_MS);
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
        drawTable('player');

        if (handValue(state.playerHand) > 21) {
            finishRound('lose', 'Vous dépassez 21.', { revealDealerHole: false });
            return;
        }

        if (isMaximumTwentyOne(state.playerHand)) {
            beginDealerTurn();
        }
    });

    btnStand.addEventListener('click', () => {
        if (state.phase === 'player') {
            beginDealerTurn();
        }
    });

    btnNew.addEventListener('click', () => {
        if (state.phase !== 'player' && state.phase !== 'dealer' && state.phase !== 'dealing') {
            startRound();
        }
    });

    betAmountInput.addEventListener('input', () => {
        betAmountInput.value = betAmountInput.value.replace(/\D/g, '');
        betAmountInput.value = String(getSelectedBet());
        updateBankrollUI();
        setActionState();
    });

    betAmountInput.addEventListener('blur', () => setBetAmount(getSelectedBet()));
    btnBetUp.addEventListener('click', () => setBetAmount(getSelectedBet() + 1));
    btnBetDown.addEventListener('click', () => setBetAmount(getSelectedBet() - 1));

    setActionState();
    drawTable();
    void streak.hydrate();

    void fetchBankrollStatus().then((status) => {
        if (status === null) {
            return;
        }

        state.bankrollPersistenceEnabled = true;
        applyBankrollStatus(status);
        maybeShowDailyModal();
    });
}
