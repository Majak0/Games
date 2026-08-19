<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BlackjackBankrollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlackjackBankrollController extends Controller
{
    public function __construct(private BlackjackBankrollService $bankrolls)
    {
    }

    public function show(Request $request): JsonResponse
    {
        return response()->json($this->bankrolls->status($request->user()));
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bankroll' => ['required', 'integer', 'min:0', 'max:9999999'],
        ]);

        return response()->json(
            $this->bankrolls->update($request->user(), $validated['bankroll'])
        );
    }

    public function claimDailyBonus(Request $request): JsonResponse
    {
        try {
            return response()->json(
                $this->bankrolls->claimDailyBonus($request->user())
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }
}
