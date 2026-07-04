export type ScoreGame = 'flag-quiz' | 'shape-quiz' | 'pile-ou-face' | 'blackjack';

export function buildFlagQuizScoreMode(pathname: string): string | null {
    const chronoMatch = pathname.match(/^\/jeux\/flag-quiz\/chrono\/(\d+)$/);

    if (chronoMatch) {
        return `chrono:${chronoMatch[1]}`;
    }

    const blindMatch = pathname.match(/^\/jeux\/flag-quiz\/aveugle\/(tous|pays)$/);

    if (blindMatch) {
        return `aveugle:${blindMatch[1]}`;
    }

    const match = pathname.match(/^\/jeux\/flag-quiz\/(tous|pays)$/);

    return match ? match[1] : null;
}

export function buildShapeQuizScoreMode(pathname: string): string | null {
    const chronoMatch = pathname.match(/^\/jeux\/shape-quiz\/chrono\/(\d+)$/);

    if (chronoMatch) {
        return `chrono:${chronoMatch[1]}`;
    }

    const match = pathname.match(/^\/jeux\/shape-quiz\/(pays|aveugle|carte)$/);

    return match ? match[1] : null;
}

export function getScoreContextFromPath(pathname: string): { game: ScoreGame; mode: string } | null {
    const flagMode = buildFlagQuizScoreMode(pathname);

    if (flagMode) {
        return { game: 'flag-quiz', mode: flagMode };
    }

    const shapeMode = buildShapeQuizScoreMode(pathname);

    if (shapeMode) {
        return { game: 'shape-quiz', mode: shapeMode };
    }

    return null;
}
