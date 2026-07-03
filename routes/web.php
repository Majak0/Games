<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameScoreController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('home');
});

Route::get('/compte', function () {
    return view('home');
});

Route::get('/compte/connexion', function () {
    return view('home');
});

Route::get('/compte/inscription', function () {
    return view('home');
});

Route::get('/classement/{game}/{mode}', function () {
    return view('home');
})->where('game', 'flag-quiz|shape-quiz')->where('mode', '[a-z0-9:]+');

Route::get('/jeux/flag-quiz', function () {
    return view('home');
});

Route::get('/jeux/flag-quiz/chrono/{minutes}', function () {
    return view('home');
})->where('minutes', '3|5|10|15');

Route::get('/jeux/flag-quiz/aveugle/{pool}', function () {
    return view('home');
})->where('pool', 'tous|pays');

Route::get('/jeux/flag-quiz/{mode}', function () {
    return view('home');
})->where('mode', 'tous|chrono|pays|aveugle');

Route::get('/jeux/shape-quiz', function () {
    return view('home');
});

Route::get('/jeux/shape-quiz/chrono/{minutes}', function () {
    return view('home');
})->where('minutes', '3|5|10|15');

Route::get('/jeux/shape-quiz/{mode}', function () {
    return view('home');
})->where('mode', 'pays|chrono|aveugle|carte');

Route::prefix('api')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth');

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

    /** @var array<string, list<string>> $synonymsByIso */
    $synonymsByIso = require database_path('data/country_synonyms.php');

    return response()->json(
        $query->orderBy('name')->get()->map(function (Country $country) use ($synonymsByIso) {
            $iso = strtolower($country->iso_code ?? '');

            return [
                'id' => $country->id,
                'name' => $country->name,
                'flag_url' => $country->flag_url,
                'iso_code' => $country->iso_code,
                'shape_url' => $country->shape_url,
                'synonyms' => $synonymsByIso[$iso] ?? [],
            ];
        })
    );
});
