<?php

namespace Tests\Feature;

use App\Models\Logo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogoQuizVisualTest extends TestCase
{
    use RefreshDatabase;

    public function test_quiz_visual_is_served_from_a_signed_token_without_cache(): void
    {
        Logo::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'synonyms' => [],
            'svg' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 12h24v2H0z"/></svg>',
            'category' => 'informatique',
            'hex' => '111111',
            'source' => 'simple-icons',
        ]);

        $start = $this->postJson('/api/logo-quiz/start', [
            'style' => 'flou',
        ]);

        $start->assertOk();
        $visualUrl = $start->json('visual_url');

        $this->assertIsString($visualUrl);
        $this->assertStringContainsString('/api/logo-quiz/visual?t=', $visualUrl);

        $this->get($visualUrl)
            ->assertOk()
            ->assertHeader('content-type', 'image/svg+xml; charset=utf-8')
            ->assertSee('<svg', false);
    }

    public function test_unknown_visual_token_returns_not_found(): void
    {
        $this->get('/api/logo-quiz/visual?t=token-invalide')->assertNotFound();
    }
}
