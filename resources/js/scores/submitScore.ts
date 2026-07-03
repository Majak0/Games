import { apiFetch } from '@/lib/api';
import { fetchCurrentUser } from '@/lib/auth';
import type { ScoreGame } from '@/scores/modeKey';

export interface SubmitScorePayload {
    game: ScoreGame;
    mode: string;
    score: number;
    elapsedMicroseconds: number;
    completed: boolean;
}

export interface SubmitScoreResult {
    saved: boolean;
    improved: boolean;
    rank: number;
    total: number;
    label: string;
}

export async function submitScore(payload: SubmitScorePayload): Promise<SubmitScoreResult | null> {
    const user = await fetchCurrentUser();

    if (!user) {
        return null;
    }

    return apiFetch<SubmitScoreResult>('/api/scores', {
        method: 'POST',
        body: JSON.stringify({
            game: payload.game,
            mode: payload.mode,
            score: payload.score,
            elapsed_microseconds: payload.elapsedMicroseconds,
            completed: payload.completed,
        }),
    });
}

export function formatScoreRankMessage(result: SubmitScoreResult): string {
    if (!result.saved) {
        return 'Score non amélioré — votre meilleur résultat est conservé.';
    }

    return `Score enregistré ! Vous êtes ${result.rank}${ordinalSuffix(result.rank)} sur ${result.total} (${result.label}).`;
}

export function formatGuestScoreMessage(): string {
    return 'Connectez-vous pour enregistrer votre score et apparaître au classement.';
}

function ordinalSuffix(rank: number): string {
    if (rank === 1) {
        return 'er';
    }

    return 'e';
}
