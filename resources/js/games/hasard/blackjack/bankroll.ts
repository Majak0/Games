import { apiFetch } from '@/lib/api';
import { fetchCurrentUser } from '@/lib/auth';

export const STARTING_BANKROLL = 50;
export const DAILY_BONUS_AMOUNT = 10;

export interface BankrollStatus {
    bankroll: number;
    canClaimDailyBonus: boolean;
    dailyBonusAmount: number;
}

function defaultStatus(bankroll: number): BankrollStatus {
    return {
        bankroll,
        canClaimDailyBonus: false,
        dailyBonusAmount: DAILY_BONUS_AMOUNT,
    };
}

export async function fetchBankrollStatus(): Promise<BankrollStatus | null> {
    const user = await fetchCurrentUser();

    if (!user) {
        return null;
    }

    try {
        return await apiFetch<BankrollStatus>('/api/blackjack/bankroll');
    } catch {
        return defaultStatus(STARTING_BANKROLL);
    }
}

export async function saveBankroll(bankroll: number): Promise<BankrollStatus | null> {
    const user = await fetchCurrentUser();

    if (!user) {
        return null;
    }

    try {
        return await apiFetch<BankrollStatus>('/api/blackjack/bankroll', {
            method: 'PUT',
            body: JSON.stringify({ bankroll }),
        });
    } catch {
        return null;
    }
}

export async function claimDailyBonus(): Promise<BankrollStatus | null> {
    const user = await fetchCurrentUser();

    if (!user) {
        return null;
    }

    try {
        return await apiFetch<BankrollStatus>('/api/blackjack/bankroll/daily-bonus', {
            method: 'POST',
        });
    } catch {
        return null;
    }
}
