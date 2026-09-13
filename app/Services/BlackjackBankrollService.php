<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

class BlackjackBankrollService
{
    public const STARTING_BANKROLL = 50;

    public const DAILY_BONUS = 10;

    /**
     * @return array{bankroll: int, canClaimDailyBonus: bool, dailyBonusAmount: int}
     */
    public function status(User $user): array
    {
        $this->ensureBankruptTimestamp($user);

        return $this->payload($user->fresh() ?? $user);
    }

    /**
     * @return array{bankroll: int, canClaimDailyBonus: bool, dailyBonusAmount: int}
     */
    public function update(User $user, int $bankroll): array
    {
        $attributes = ['blackjack_bankroll' => $bankroll];

        if ($bankroll === 0 && $user->blackjack_bankroll > 0) {
            $attributes['blackjack_bankrupt_at'] = now();
        }

        if ($bankroll > 0) {
            $attributes['blackjack_bankrupt_at'] = null;
        }

        $user->update($attributes);

        return $this->payload($user->fresh() ?? $user);
    }

    /**
     * @return array{bankroll: int, canClaimDailyBonus: bool, dailyBonusAmount: int}
     */
    public function claimDailyBonus(User $user): array
    {
        $this->ensureBankruptTimestamp($user);
        $user->refresh();

        if (! $this->canClaimDailyBonus($user)) {
            throw new InvalidArgumentException('La récupération quotidienne n\'est pas disponible.');
        }

        $user->update([
            'blackjack_bankroll' => min(9999999, $user->blackjack_bankroll + self::DAILY_BONUS),
            'blackjack_bankrupt_at' => null,
            'blackjack_daily_bonus_claimed_at' => now(),
        ]);

        return $this->payload($user->fresh() ?? $user);
    }

    private function ensureBankruptTimestamp(User $user): void
    {
        if ($user->blackjack_bankroll === 0 && $user->blackjack_bankrupt_at === null) {
            $user->update(['blackjack_bankrupt_at' => now()]);
            $user->refresh();
        }
    }

    private function canClaimDailyBonus(User $user): bool
    {
        if ($user->blackjack_daily_bonus_claimed_at === null) {
            return true;
        }

        return $user->blackjack_daily_bonus_claimed_at->toDateString() < Carbon::now()->toDateString();
    }

    /**
     * @return array{bankroll: int, canClaimDailyBonus: bool, dailyBonusAmount: int}
     */
    private function payload(User $user): array
    {
        return [
            'bankroll' => $user->blackjack_bankroll,
            'canClaimDailyBonus' => $this->canClaimDailyBonus($user),
            'dailyBonusAmount' => self::DAILY_BONUS,
        ];
    }
}
