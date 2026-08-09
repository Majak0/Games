/** Normalise un chemin (sans slash final, sauf la racine). */
export function normalizePath(pathname: string): string {
    if (pathname.length > 1 && pathname.endsWith('/')) {
        return pathname.slice(0, -1);
    }

    return pathname;
}

export function pathIs(pathname: string, target: string): boolean {
    return normalizePath(pathname) === target;
}

/** Découpe un chemin en segments : "/jeux/flag-quiz/tous" → ["jeux", "flag-quiz", "tous"] */
export function pathSegments(pathname: string): string[] {
    return normalizePath(pathname).split('/').filter(Boolean);
}

export type LeaderboardGame = 'flag-quiz' | 'shape-quiz';

export function parseLeaderboardPath(pathname: string): { game: LeaderboardGame; mode: string } | null {
    const parts = pathSegments(pathname);

    if (parts.length !== 3 || parts[0] !== 'classement') {
        return null;
    }

    const game = parts[1];

    switch (game) {
        case 'flag-quiz':
        case 'shape-quiz':
            return { game, mode: parts[2] };
        default:
            return null;
    }
}

/** Vérifie que jeux/{game} est le préfixe du chemin. */
export function isGamePath(pathname: string, game: string): boolean {
    const parts = pathSegments(pathname);

    return parts.length >= 2 && parts[0] === 'jeux' && parts[1] === game;
}
