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

Route::get('/api/countries', function (Request $request) {
    $query = Country::query();

    if ($request->query('pool') === 'sovereign') {
        $query->where('is_official_country', true);
    }

    return response()->json($query->orderBy('name')->get());
});
