/**
 * Utilitaires partagés pour générer des silhouettes SVG depuis @svg-maps/world.
 */
import world from '@svg-maps/world';
import fs from 'fs';
import path from 'path';

export const SHAPE_FILL = '#000000';

export function tokenizePath(pathData) {
    return pathData.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
}

export function getPathBoundingBox(pathData) {
    const tokens = tokenizePath(pathData);
    let index = 0;
    let x = 0;
    let y = 0;
    let startX = 0;
    let startY = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    function addPoint(px, py) {
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
    }

    function isCommand(token) {
        return /^[a-zA-Z]$/.test(token);
    }

    function readNumber() {
        return parseFloat(tokens[index++]);
    }

    while (index < tokens.length) {
        const command = tokens[index++];
        const relative = command === command.toLowerCase() && command !== 'Z' && command !== 'z';
        const op = command.toLowerCase();

        if (op === 'm') {
            const firstX = readNumber();
            const firstY = readNumber();
            x = relative ? x + firstX : firstX;
            y = relative ? y + firstY : firstY;
            startX = x;
            startY = y;
            addPoint(x, y);

            while (index < tokens.length && !isCommand(tokens[index])) {
                const dx = readNumber();
                const dy = readNumber();
                x = relative ? x + dx : dx;
                y = relative ? y + dy : dy;
                addPoint(x, y);
            }

            continue;
        }

        if (op === 'l') {
            while (index < tokens.length && !isCommand(tokens[index])) {
                const dx = readNumber();
                const dy = readNumber();
                x = relative ? x + dx : dx;
                y = relative ? y + dy : dy;
                addPoint(x, y);
            }

            continue;
        }

        if (op === 'h') {
            while (index < tokens.length && !isCommand(tokens[index])) {
                const delta = readNumber();
                x = relative ? x + delta : delta;
                addPoint(x, y);
            }

            continue;
        }

        if (op === 'v') {
            while (index < tokens.length && !isCommand(tokens[index])) {
                const delta = readNumber();
                y = relative ? y + delta : delta;
                addPoint(x, y);
            }

            continue;
        }

        if (op === 'z') {
            x = startX;
            y = startY;
            continue;
        }

        if (op === 'c') {
            while (index < tokens.length && !isCommand(tokens[index])) {
                const x1 = readNumber();
                const y1 = readNumber();
                const x2 = readNumber();
                const y2 = readNumber();
                const x3 = readNumber();
                const y3 = readNumber();

                if (relative) {
                    addPoint(x + x1, y + y1);
                    addPoint(x + x2, y + y2);
                    x += x3;
                    y += y3;
                } else {
                    addPoint(x1, y1);
                    addPoint(x2, y2);
                    x = x3;
                    y = y3;
                }

                addPoint(x, y);
            }

            continue;
        }

        while (index < tokens.length && !isCommand(tokens[index])) {
            index += 1;
        }
    }

    if (!Number.isFinite(minX)) {
        return null;
    }

    return {
        minX,
        minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

export function buildCountryShapeSvg(pathData) {
    const bounds = getPathBoundingBox(pathData);

    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
        return null;
    }

    const padding = Math.max(bounds.width, bounds.height) * 0.08;
    const viewBox = [
        bounds.minX - padding,
        bounds.minY - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2,
    ].join(' ');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path fill="${SHAPE_FILL}" d="${pathData}"/></svg>`;
}

export function writeShapeFromWorldMap(iso, outDir) {
    const location = world.locations.find((entry) => entry.id === iso);

    if (!location) {
        return false;
    }

    const svg = buildCountryShapeSvg(location.path);

    if (!svg) {
        return false;
    }

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${iso}.svg`), svg);

    return true;
}

export function writeShapeFromFallback(iso, fallbackIso, outDir) {
    const location = world.locations.find((entry) => entry.id === fallbackIso);

    if (!location) {
        return false;
    }

    const svg = buildCountryShapeSvg(location.path);

    if (!svg) {
        return false;
    }

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${iso}.svg`), svg);

    return true;
}
