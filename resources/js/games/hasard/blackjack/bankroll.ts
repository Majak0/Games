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

async function forAuthenticatedUser<T>(
    action: () => Promise<T>,
    fallback: T | null = null,
): Promise<T | null> {
    if (!(await fetchCurrentUser())) {
        return fallback;
    }

    try {
        return await action();
    } catch {
        return fallback;
    }
}

export async function fetchBankrollStatus(): Promise<BankrollStatus | null> {
    return forAuthenticatedUser(
        () => apiFetch<BankrollStatus>('/api/blackjack/bankroll'),
        defaultStatus(STARTING_BANKROLL),
    );
}

export async function saveBankroll(bankroll: number): Promise<BankrollStatus | null> {
    return forAuthenticatedUser(() =>
        apiFetch<BankrollStatus>('/api/blackjack/bankroll', {
            method: 'PUT',
            body: JSON.stringify({ bankroll }),
        }));
}

export async function claimDailyBonus(): Promise<BankrollStatus | null> {
    return forAuthenticatedUser(() =>
        apiFetch<BankrollStatus>('/api/blackjack/bankroll/daily-bonus', {
            method: 'POST',
        }));
}
