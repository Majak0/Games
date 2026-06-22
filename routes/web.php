<?php

use Illuminate\Support\Facades\Route;
use App\Models\Country;

Route::get('/', function () {
    return view('home');
});

Route::get('/api/countries', function () {
    return response()->json(Country::all());
});
