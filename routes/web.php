<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Country;

Route::get('/', function () {
    return view('home');
});

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
        $query->where('is_official_country', true);
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
