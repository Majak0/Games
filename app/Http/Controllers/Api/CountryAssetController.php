<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CountryAssetController extends Controller
{
    public function flag(string $iso): Response
    {
        return $this->svgResponse(
            Country::query()->where('iso_code', strtolower($iso))->value('flag_svg')
        );
    }

    public function shape(string $iso): Response
    {
        $code = strtolower($iso);
        $country = Country::query()->where('iso_code', $code)->first();

        if (! $country?->shape_svg) {
            $baseCode = str_contains($code, '-') ? explode('-', $code)[0] : $code;
            $country = Country::query()->where('iso_code', $baseCode)->first();
        }

        return $this->svgResponse($country?->shape_svg);
    }

    private function svgResponse(?string $svg): Response
    {
        if (! $svg) {
            abort(HttpResponse::HTTP_NOT_FOUND);
        }

        return response($svg, HttpResponse::HTTP_OK, [
            'Content-Type' => 'image/svg+xml; charset=utf-8',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
