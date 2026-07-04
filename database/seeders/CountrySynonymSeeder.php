<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\CountrySynonym;
use Illuminate\Database\Seeder;

class CountrySynonymSeeder extends Seeder
{
    public function run(): void
    {
        /** @var array<string, list<string>> $synonymsByIso */
        $synonymsByIso = require database_path('data/country_synonyms.php');

        foreach ($synonymsByIso as $iso => $synonyms) {
            $country = Country::query()->where('iso_code', strtolower($iso))->first();

            if (! $country) {
                continue;
            }

            foreach ($synonyms as $synonym) {
                CountrySynonym::query()->firstOrCreate([
                    'country_id' => $country->id,
                    'synonym' => $synonym,
                ]);
            }
        }
    }
}
