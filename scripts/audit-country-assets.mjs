/**
 * Audit des drapeaux (flagcdn) et formes (mapsicon + fichiers locaux).
 *
 * Usage:
 *   node scripts/audit-country-assets.mjs [pool]
 *   pool: all | world | sovereign | map  (défaut: all)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = process.argv[2] ?? 'all';
const apiBase = process.env.APP_URL ?? 'http://127.0.0.1:8000';

function parsePhpStringArray(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/return\s*\[([\s\S]*?)\];/);

    if (!match) {
        return [];
    }

    return [...match[1].matchAll(/'([a-z0-9-]+)'/g)].map((entry) => entry[1]);
}

async function headStatus(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });

        return response.status;
    } catch {
        return 0;
    }
}

function localFlagPath(iso) {
    return path.join(__dirname, '..', 'public', 'assets', 'flags', `${iso}.svg`);
}

function localShapePath(iso) {
    return path.join(__dirname, '..', 'public', 'assets', 'shapes', `${iso}.svg`);
}

function shapeCandidates(iso) {
    const candidates = [iso];

    if (iso.includes('-')) {
        candidates.push(iso.split('-')[0]);
    }

    return candidates;
}

function hasLocalShape(iso) {
    return shapeCandidates(iso).some((candidate) => fs.existsSync(localShapePath(candidate)));
}

function parsePhpAssoc(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/return\s*\[([\s\S]*?)\];/);

    if (!match) {
        return {};
    }

    const result = {};

    for (const entry of match[1].matchAll(/'([^']+)'\s*=>\s*'([^']+)'/g)) {
        result[entry[1]] = entry[2];
    }

    return result;
}

function resolveFlagUrl(country, flagOverrides) {
    const iso = String(country.iso_code ?? '').toLowerCase();

    if (fs.existsSync(localFlagPath(iso))) {
        return null;
    }

    return flagOverrides[iso] ?? country.flag_url;
}

async function main() {
    const response = await fetch(`${apiBase}/api/countries`);

    if (!response.ok) {
        console.error(`API inaccessible (${response.status}). Lancez php artisan serve.`);
        process.exit(1);
    }

    let countries = await response.json();
    const worldCodes = new Set(parsePhpStringArray(path.join(__dirname, '..', 'database', 'data', 'world_quiz_iso_codes.php')));

    if (pool === 'world') {
        countries = countries.filter((country) => worldCodes.has(country.iso_code));
    } else if (pool === 'sovereign') {
        const sovereignResponse = await fetch(`${apiBase}/api/countries?pool=sovereign`);
        countries = await sovereignResponse.json();
    } else if (pool === 'map') {
        const mapResponse = await fetch(`${apiBase}/api/countries?pool=map`);
        countries = await mapResponse.json();
    } else if (pool !== 'all') {
        console.error('Pool invalide. Utilisez : all, world, sovereign ou map.');
        process.exit(1);
    }

    const flagOverrides = parsePhpAssoc(path.join(__dirname, '..', 'database', 'data', 'flag_url_overrides.php'));
    const missingFlags = [];
    const missingShapes = [];

    for (const country of countries) {
        const iso = String(country.iso_code ?? '').toLowerCase();
        const assetCode = iso.includes('-') ? iso.split('-')[0] : iso;
        const effectiveFlagUrl = resolveFlagUrl(country, flagOverrides);
        const flagStatus = effectiveFlagUrl ? await headStatus(effectiveFlagUrl) : 200;

        if (flagStatus !== 200) {
            missingFlags.push({ name: country.name, iso, url: effectiveFlagUrl ?? country.flag_url, status: flagStatus });
        }

        if (hasLocalShape(iso)) {
            continue;
        }

        const mapsiconUrl = `https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/${assetCode}/vector.svg`;
        const shapeStatus = await headStatus(mapsiconUrl);

        if (shapeStatus !== 200) {
            missingShapes.push({
                name: country.name,
                iso,
                status: shapeStatus,
                fix: `npm run fix:assets -- ${pool}`,
            });
        }
    }

    console.log(`Audit des visuels — pool « ${pool} » (${countries.length} pays)\n`);

    if (missingFlags.length === 0) {
        console.log('Drapeaux : aucun manquant.');
    } else {
        console.log(`Drapeaux manquants (${missingFlags.length}) :`);
        for (const row of missingFlags) {
            console.log(`  - ${row.name} (${row.iso}) HTTP ${row.status} → ${row.url}`);
        }
    }

    console.log('');

    if (missingShapes.length === 0) {
        console.log('Formes : aucune manquante.');
    } else {
        console.log(`Formes manquantes (${missingShapes.length}) :`);
        for (const row of missingShapes) {
            console.log(`  - ${row.name} (${row.iso}) HTTP ${row.status} → ${row.fix}`);
        }
        console.log('\nCorrection : npm run fix:assets -- '+pool);
    }

    process.exit(missingFlags.length === 0 && missingShapes.length === 0 ? 0 : 1);
}

main();
