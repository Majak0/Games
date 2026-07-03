import type { Country } from '@/types/country';

export interface ApiCountry {
    name: string;
    flag_url: string;
    iso_code?: string | null;
    shape_url?: string | null;
    synonyms?: string[];
}

export function mapApiCountry(country: ApiCountry): Country {
    return {
        name: country.name,
        flagUrl: country.flag_url,
        shapeUrl: country.shape_url ?? undefined,
        isoCode: country.iso_code?.toLowerCase(),
        synonyms: country.synonyms ?? [],
    };
}
