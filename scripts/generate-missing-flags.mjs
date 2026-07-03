/**
 * Télécharge public/assets/flags/{iso}.svg depuis flagcdn (code parent).
 *
 * Usage: node scripts/generate-missing-flags.mjs [iso:parent ...]
 *        node scripts/generate-missing-flags.mjs --defaults
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'assets', 'flags');

const defaults = {
    go: 'fr',
    ju: 'fr',
    ta: 'gb',
};

function parseArgs(argv) {
    if (argv.includes('--defaults')) {
        return defaults;
    }

    const pairs = {};

    for (const arg of argv) {
        if (arg.startsWith('--')) {
            continue;
        }

        const [iso, parent = iso] = arg.includes(':') ? arg.split(':') : [arg, arg];
        pairs[iso.toLowerCase()] = parent.toLowerCase();
    }

    return Object.keys(pairs).length > 0 ? pairs : defaults;
}

async function downloadFlag(iso, parentCode) {
    const url = `https://flagcdn.com/${parentCode}.svg`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Impossible de télécharger ${url} (HTTP ${response.status})`);
    }

    const svg = await response.text();
    fs.writeFileSync(path.join(outDir, `${iso}.svg`), svg);
    console.log(`Généré : public/assets/flags/${iso}.svg (depuis ${parentCode})`);
}

const pairs = parseArgs(process.argv.slice(2));
fs.mkdirSync(outDir, { recursive: true });

for (const [iso, parent] of Object.entries(pairs)) {
    try {
        await downloadFlag(iso, parent);
    } catch (error) {
        console.error(`${iso}: ${error.message}`);
        process.exitCode = 1;
    }
}
