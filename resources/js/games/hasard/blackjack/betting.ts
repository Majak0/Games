import { formatMoney } from './ui';

export type WinPayout = 'standard' | 'blackjack';

export function blackjackProfit(bet: number): number {
    return Math.floor((bet * 3) / 2);
}

export interface BetSettlement {
    bankrollDelta: number;
    detail: string;
}

export function settleBetAmount(
    roundBet: number,
    outcome: 'win' | 'lose' | 'push',
    winPayout: WinPayout = 'standard',
): BetSettlement {
    if (roundBet <= 0) {
        return { bankrollDelta: 0, detail: '' };
    }

    if (outcome === 'win') {
        if (winPayout === 'blackjack') {
            const profit = blackjackProfit(roundBet);

            return {
                bankrollDelta: roundBet + profit,
                detail: ` (+${formatMoney(profit)})`,
            };
        }

        return {
            bankrollDelta: roundBet * 2,
            detail: ` (+${formatMoney(roundBet)})`,
        };
    }

    if (outcome === 'push') {
        return {
            bankrollDelta: roundBet,
            detail: ' (mise rendue)',
        };
    }

    return {
        bankrollDelta: 0,
        detail: ` (-${formatMoney(roundBet)})`,
    };
}

export function clampBet(rawValue: string, bankroll: number): number {
    const parsed = Number.parseInt(rawValue, 10);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return Math.min(1, bankroll);
    }

    return Math.min(parsed, bankroll);
}
