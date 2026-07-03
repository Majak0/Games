<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GameScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameScoreController extends Controller
{
    public function __construct(private GameScoreService $scores)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'game' => ['required', 'string', 'in:flag-quiz,shape-quiz'],
            'mode' => ['required', 'string', 'max:64'],
            'score' => ['required', 'integer', 'min:0'],
            'elapsed_microseconds' => ['required', 'integer', 'min:0'],
            'completed' => ['required', 'boolean'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        try {
            $result = $this->scores->submit($user, $validated['game'], $validated['mode'], [
                'score' => $validated['score'],
                'elapsed_microseconds' => $validated['elapsed_microseconds'],
                'completed' => $validated['completed'],
            ]);
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'saved' => $result['saved'],
            'improved' => $result['improved'],
            'rank' => $result['rank'],
            'total' => $result['total'],
            'label' => $this->scores->modeLabel($validated['game'], $validated['mode']),
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
            ],
            'scores' => $this->scores->profileScores($user),
        ]);
    }
}
