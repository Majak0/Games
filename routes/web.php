<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CountryAssetController;
use App\Http\Controllers\Api\GameScoreController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

$spa = fn () => view('home');

Route::get('/', $spa);

Route::prefix('api')->group(function () {
    Route::get('/assets/flags/{iso}', [CountryAssetController::class, 'flag']);
    Route::get('/assets/shapes/{iso}', [CountryAssetController::class, 'shape']);

    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth');
    Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:5,10');

    Route::get('/leaderboards/catalog', [LeaderboardController::class, 'catalog']);
    Route::get('/leaderboards/{game}/{mode}', [LeaderboardController::class, 'show']);

    Route::middleware('auth')->group(function () {
        Route::post('/scores', [GameScoreController::class, 'store']);
        Route::get('/scores/me', [GameScoreController::class, 'profile']);
    });
});

Route::get('/api/world-map-meta', function () {
    /** @var array<string, string> $territoryParents */
    $territoryParents = require database_path('data/map_territory_parents.php');

    return response()->json([
        'territoryParents' => $territoryParents,
    ]);
});

Route::get('/api/countries', function (Request $request) {
    $query = Country::query();

    if ($request->query('pool') === 'sovereign') {
        $query->where('is_sovereign', true);
    }

    if ($request->query('pool') === 'map') {
        $query->where('is_on_world_map', true);
    }

    if ($request->query('pool') === 'world') {
        /** @var list<string> $worldQuizCodes */
        $worldQuizCodes = require database_path('data/world_quiz_iso_codes.php');
        $query->whereIn('iso_code', $worldQuizCodes);
    }

    return response()->json(
        $query->with('synonyms')->orderBy('name')->get()->map(fn (Country $country) => [
            'id' => $country->id,
            'name' => $country->name,
            'flag_url' => $country->flag_url,
            'iso_code' => $country->iso_code,
            'shape_url' => $country->shape_url,
            'synonyms' => $country->synonyms->pluck('synonym')->all(),
        ])
    );
});

// Toutes les pages frontend partagent la même vue (routage côté client).
Route::fallback($spa);
