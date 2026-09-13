<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlackjackBankrollController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CountryAssetController;
use App\Http\Controllers\Api\GameScoreController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\LogoQuizController;
use App\Models\Country;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;
use Illuminate\View\Middleware\ShareErrorsFromSession;

$spa = fn () => view('home');

Route::get('/', $spa);

Route::prefix('api')->group(function () {
    Route::get('/assets/flags/{iso}', [CountryAssetController::class, 'flag']);
    Route::get('/assets/shapes/{iso}', [CountryAssetController::class, 'shape']);

    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,10');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:8,1');
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth');
    Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:5,10');

    Route::get('/logo-quiz/categories', [LogoQuizController::class, 'categories']);
    Route::post('/logo-quiz/start', [LogoQuizController::class, 'start']);
    Route::post('/logo-quiz/guess', [LogoQuizController::class, 'guess'])->middleware('throttle:60,1');
    Route::post('/logo-quiz/skip', [LogoQuizController::class, 'skip'])->middleware('throttle:30,1');
    Route::get('/logo-quiz/visual', [LogoQuizController::class, 'visual'])
        ->withoutMiddleware([StartSession::class, ShareErrorsFromSession::class, ValidateCsrfToken::class]);
    Route::get('/logo-quiz/found/{token}', [LogoQuizController::class, 'found'])
        ->where('token', '[A-Za-z0-9]{20,64}')
        ->withoutMiddleware([StartSession::class, ShareErrorsFromSession::class, ValidateCsrfToken::class]);

    Route::get('/leaderboards/catalog', [LeaderboardController::class, 'catalog']);
    Route::get('/leaderboards/{game}/{mode}', [LeaderboardController::class, 'show']);

    Route::middleware('auth')->group(function () {
        Route::get('/blackjack/bankroll', [BlackjackBankrollController::class, 'show']);
        Route::put('/blackjack/bankroll', [BlackjackBankrollController::class, 'update']);
        Route::post('/blackjack/bankroll/daily-bonus', [BlackjackBankrollController::class, 'claimDailyBonus']);
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
