<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GameScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class LeaderboardController extends Controller
{
    public function __construct(private GameScoreService $scores)
    {
    }

    public function show(Request $request, string $game, string $mode): JsonResponse
    {
        try {
            $this->scores->modeType($game, $mode);
        } catch (InvalidArgumentException) {
            return response()->json(['message' => 'Mode de jeu invalide.'], 404);
        }

        $entries = $this->scores->leaderboard($game, $mode, 100)
            ->values()
            ->map(function ($score, int $index) {
                return [
                    'rank' => $index + 1,
                    'username' => $score->user?->username,
                    'score' => $score->score,
                    'elapsed_microseconds' => $score->elapsed_microseconds,
                    'completed' => $score->completed,
                ];
            });

        return response()->json([
            'game' => $game,
            'mode' => $mode,
            'label' => $this->scores->modeLabel($game, $mode),
            'entries' => $entries,
        ]);
    }

    public function catalog(): JsonResponse
    {
        $catalog = [];

        foreach ($this->scores->modeCatalog() as $game => $modes) {
            foreach ($modes as $mode => $meta) {
                $catalog[] = [
                    'game' => $game,
                    'mode' => $mode,
                    'label' => $meta['label'],
                    'type' => $meta['type'],
                ];
            }
        }

        return response()->json(['modes' => $catalog]);
    }
}
