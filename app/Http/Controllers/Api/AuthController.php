<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return response()->json(['user' => null]);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
            ],
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:32', 'regex:/^[a-zA-Z0-9_]+$/', 'unique:users,username'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ], [
            'username.regex' => 'Le pseudo ne peut contenir que des lettres, chiffres et underscores.',
        ]);

        $user = User::query()->create([
            'name' => $validated['username'],
            'username' => $validated['username'],
            'email' => null,
            'password' => Hash::make($validated['password']),
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt([
            'username' => $validated['username'],
            'password' => $validated['password'],
        ])) {
            return response()->json([
                'message' => 'Pseudo ou mot de passe incorrect.',
            ], 422);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }
}
