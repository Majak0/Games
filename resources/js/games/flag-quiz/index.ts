import { COUNTRIES } from './data';
import { buildQuestion, getAnswerFeedback } from './gameLogic';

export function initFlagQuiz(root: HTMLElement): void {
    root.textContent = '';

    const question = buildQuestion(COUNTRIES, 4);

    root.innerHTML = `
    <form class="h-screen flex flex-col items-center justify-center gap-4">
        <img src="${question.correct.flagUrl}" alt="Flag to guess" class="w-24 h-16">
        <input type="text" name="countryName" class="border border-gray-300 rounded-md p-2" placeholder="Quel est le nom de ce pays ?" required autofocus>
        <p id="feedback"></p>
        <button type="submit" class="bg-blue-500 text-white rounded-md p-2">
            Valider
        </button>
    </form>
    `;

    const form = root.querySelector('form') as HTMLFormElement;

    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const input = form.querySelector(
            'input[name="countryName"]'
        ) as HTMLInputElement;

        const result = getAnswerFeedback(
            question,
            input.value
        );

        switch (result) {
            case 'correct':
                alert('Bravo !');
                break;
            case 'close':
                alert('Presque !');
                break;
            case 'wrong':
                alert('Mauvais !');
                break;
        }
    });
}

