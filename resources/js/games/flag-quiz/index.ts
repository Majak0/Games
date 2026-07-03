import type { FlagQuizMode } from './modes';
import { initCountryQuiz } from '@/games/shared/countryQuiz/initCountryQuiz';
import { flagQuizConfig } from './config';

export async function initFlagQuiz(root: HTMLElement, mode: FlagQuizMode): Promise<void> {
    await initCountryQuiz(root, mode, flagQuizConfig);
}
