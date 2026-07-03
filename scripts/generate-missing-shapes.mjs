/**
 * Génère public/assets/shapes/{iso}.svg à partir de @svg-maps/world
 * pour les pays absents de mapsicon.
 *
 * Usage: node scripts/generate-missing-shapes.mjs [iso...]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeShapeFromWorldMap } from './svg-shape-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'assets', 'shapes');

const defaultCodes = ['fm', 'mh', 'ps', 'tv', 'xk'];
const codes = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultCodes;

for (const code of codes) {
    if (writeShapeFromWorldMap(code, outDir)) {
        console.log(`Généré : public/assets/shapes/${code}.svg`);
        continue;
    }

    console.error(`Carte SVG : pays « ${code} » introuvable ou bbox invalide.`);
    process.exitCode = 1;
}
