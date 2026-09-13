<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlackjackBankrollTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_claim_the_daily_bonus(): void
    {
        $this->postJson('/api/blackjack/bankroll/daily-bonus')->assertUnauthorized();
    }

    public function test_authenticated_users_can_claim_ten_free_tokens_once_per_day(): void
    {
        $user = User::factory()->create([
            'blackjack_bankroll' => 20,
        ]);

        $this->actingAs($user)
            ->getJson('/api/blackjack/bankroll')
            ->assertOk()
            ->assertJson([
                'bankroll' => 20,
                'canClaimDailyBonus' => true,
                'dailyBonusAmount' => 10,
            ]);

        $this->actingAs($user)
            ->postJson('/api/blackjack/bankroll/daily-bonus')
            ->assertOk()
            ->assertJson([
                'bankroll' => 30,
                'canClaimDailyBonus' => false,
                'dailyBonusAmount' => 10,
            ]);

        $this->actingAs($user)
            ->postJson('/api/blackjack/bankroll/daily-bonus')
            ->assertUnprocessable()
            ->assertJson([
                'message' => 'La récupération quotidienne n\'est pas disponible.',
            ]);

        $this->assertSame(30, $user->fresh()?->blackjack_bankroll);

        $this->travelTo(now()->addDay());

        $this->actingAs($user->fresh())
            ->postJson('/api/blackjack/bankroll/daily-bonus')
            ->assertOk()
            ->assertJson([
                'bankroll' => 40,
                'canClaimDailyBonus' => false,
            ]);
    }
}
