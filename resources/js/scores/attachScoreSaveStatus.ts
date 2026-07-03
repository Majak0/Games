import { getScoreContextFromPath } from '@/scores/modeKey';
import {
    formatGuestScoreMessage,
    formatScoreRankMessage,
    submitScore,
} from '@/scores/submitScore';

export async function attachScoreSaveStatus(
    root: HTMLElement,
    score: number,
    elapsedMicroseconds: number,
    completed: boolean
): Promise<void> {
    const status = root.querySelector('#score-save-status') as HTMLParagraphElement | null;

    if (!status) {
        return;
    }

    const context = getScoreContextFromPath(window.location.pathname);

    if (!context) {
        status.textContent = '';
        status.classList.add('hidden');

        return;
    }

    try {
        const result = await submitScore({
            game: context.game,
            mode: context.mode,
            score,
            elapsedMicroseconds,
            completed,
        });

        if (!result) {
            status.innerHTML = `${formatGuestScoreMessage()} <a href="/compte/connexion" class="text-neon-green hover:underline">Se connecter</a>`;
            status.className = 'arcade-score-save text-sm text-zinc-300';

            return;
        }

        status.textContent = formatScoreRankMessage(result);
        status.className = `arcade-score-save text-sm ${result.saved ? 'arcade-feedback--success' : 'arcade-feedback--neutral'}`;
    } catch (caught) {
        status.textContent = caught instanceof Error ? caught.message : 'Enregistrement impossible.';
        status.className = 'arcade-score-save text-sm arcade-feedback--error';
    }
}

export const scoreSaveSectionHtml = `
        <p id="score-save-status" class="arcade-score-save text-sm text-zinc-400 mt-4">Enregistrement du score…</p>`;
