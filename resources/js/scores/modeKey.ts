import { getFlagQuizScoreKeyFromPath } from '@/games/flag-quiz/modes';
import { getShapeQuizScoreKeyFromPath } from '@/games/shape-quiz/modes';

export type ScoreGame = 'flag-quiz' | 'shape-quiz' | 'pile-ou-face' | 'blackjack';

export function buildFlagQuizScoreMode(pathname: string): string | null {
    return getFlagQuizScoreKeyFromPath(pathname);
}

export function buildShapeQuizScoreMode(pathname: string): string | null {
    return getShapeQuizScoreKeyFromPath(pathname);
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
