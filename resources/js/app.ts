import { initFlagQuiz } from '@/games/flag-quiz';

document.addEventListener('DOMContentLoaded', async () => {
    const root = document.getElementById('app');

    if (!root) {
        return;
    }

    await initFlagQuiz(root);
});
