/**
 * Corrige automatiquement drapeaux et formes manquants.
 *
 * Usage:
 *   node scripts/fix-missing-assets.mjs [pool]
 *   pool: all | world | sovereign | map  (défaut: all)
 *
 * Prérequis : php artisan serve (API locale)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { writeShapeFromFallback, writeShapeFromWorldMap } from './svg-shape-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const pool = process.argv[2] ?? 'all';
const apiBase = process.env.APP_URL ?? 'http://127.0.0.1:8000';

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

function localShapePath(iso) {
    return path.join(rootDir, 'public', 'assets', 'shapes', `${iso}.svg`);
}

function localFlagPath(iso) {
    return path.join(rootDir, 'public', 'assets', 'flags', `${iso}.svg`);
}

function resolveFlagUrl(country, flagOverrides) {
    const iso = String(country.iso_code ?? '').toLowerCase();

    if (fs.existsSync(localFlagPath(iso))) {
        return null;
    }

    return flagOverrides[iso] ?? country.flag_url;
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

function generateShape(iso, shapeFallbacks, outDir) {
    if (writeShapeFromWorldMap(iso, outDir)) {
        console.log(`Forme générée : public/assets/shapes/${iso}.svg`);

        return true;
    }

    const fallbackIso = shapeFallbacks[iso];

    if (fallbackIso && writeShapeFromFallback(iso, fallbackIso, outDir)) {
        console.log(`Forme générée : public/assets/shapes/${iso}.svg (copie de ${fallbackIso})`);

        return true;
    }

    return false;
}

async function downloadFlag(iso, url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const outDir = path.join(rootDir, 'public', 'assets', 'flags');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(localFlagPath(iso), await response.text());
    console.log(`Drapeau généré : public/assets/flags/${iso}.svg`);
}

async function loadCountries() {
    const response = await fetch(`${apiBase}/api/countries`);

    if (!response.ok) {
        throw new Error(`API inaccessible (${response.status}). Lancez php artisan serve.`);
    }

    let countries = await response.json();
    const worldCodes = new Set(parsePhpStringArray(path.join(rootDir, 'database', 'data', 'world_quiz_iso_codes.php')));

    if (pool === 'world') {
        countries = countries.filter((country) => worldCodes.has(country.iso_code));
    } else if (pool === 'sovereign') {
        const sovereignResponse = await fetch(`${apiBase}/api/countries?pool=sovereign`);
        countries = await sovereignResponse.json();
    } else if (pool === 'map') {
        const mapResponse = await fetch(`${apiBase}/api/countries?pool=map`);
        countries = await mapResponse.json();
    } else if (pool !== 'all') {
        throw new Error('Pool invalide. Utilisez : all, world, sovereign ou map.');
    }

    return countries;
}

async function main() {
    const flagOverrides = parsePhpAssoc(path.join(rootDir, 'database', 'data', 'flag_url_overrides.php'));
    const shapeFallbacks = parsePhpAssoc(path.join(rootDir, 'database', 'data', 'shape_url_fallbacks.php'));
    const countries = await loadCountries();

    console.log(`Correction des visuels — pool « ${pool} » (${countries.length} pays)\n`);

    let fixedFlags = 0;
    let fixedShapes = 0;
    const unresolvedFlags = [];
    const unresolvedShapes = [];

    for (const country of countries) {
        const iso = String(country.iso_code ?? '').toLowerCase();
        const assetCode = iso.includes('-') ? iso.split('-')[0] : iso;
        const effectiveFlagUrl = resolveFlagUrl(country, flagOverrides);
        const flagStatus = effectiveFlagUrl ? await headStatus(effectiveFlagUrl) : 200;

        if (flagStatus !== 200 && !fs.existsSync(localFlagPath(iso))) {
            unresolvedFlags.push(`${country.name} (${iso})`);
            continue;
        }

        if (flagStatus !== 200 && effectiveFlagUrl) {
            try {
                await downloadFlag(iso, effectiveFlagUrl);
                fixedFlags += 1;
            } catch (error) {
                unresolvedFlags.push(`${country.name} (${iso}) : ${error.message}`);
            }
        }

        if (hasLocalShape(iso)) {
            continue;
        }

        const mapsiconUrl = `https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/${assetCode}/vector.svg`;
        const shapeStatus = await headStatus(mapsiconUrl);

        if (shapeStatus === 200) {
            continue;
        }

        if (generateShape(iso, shapeFallbacks, path.join(rootDir, 'public', 'assets', 'shapes'))) {
            fixedShapes += 1;
        } else {
            unresolvedShapes.push(`${country.name} (${iso})`);
        }
    }

    console.log(`\nRésumé : ${fixedFlags} drapeau(x), ${fixedShapes} forme(s) générés.`);

    if (unresolvedFlags.length > 0) {
        console.log('\nDrapeaux non corrigés :');
        unresolvedFlags.forEach((line) => console.log(`  - ${line}`));
    }

    if (unresolvedShapes.length > 0) {
        console.log('\nFormes non corrigées :');
        unresolvedShapes.forEach((line) => console.log(`  - ${line}`));
    }

    console.log('\nVérification…');
    execSync(`node scripts/audit-country-assets.mjs ${pool}`, { cwd: rootDir, stdio: 'inherit' });
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
