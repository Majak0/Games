import { initFlagQuiz } from '@/games/flag-quiz';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('app');

    if (!root) {
        return;
    }

    initFlagQuiz(root);
});
