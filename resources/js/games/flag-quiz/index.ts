import { COUNTRIES } from './data';
import {
    createQuizState,
    advanceQuizOnCorrect,
    getAnswerFeedback,
    getScoreLabel,
    QuizState,
} from './gameLogic';

export function initFlagQuiz(root: HTMLElement): void {
    root.textContent = '';

    let state: QuizState = createQuizState(COUNTRIES, 4);

    root.innerHTML = `
    <div class="relative h-screen">
        <div id="score" class="absolute top-4 right-4 bg-black/50 text-white rounded-full px-4 py-2 text-sm font-bold">${getScoreLabel(state.score)}</div>
        <div id="remaining" class="absolute top-4 left-4 bg-black/50 text-white rounded-full px-4 py-2 text-sm font-bold">Restants : ${state.remainingCountries.length}</div>
        <form autocomplete="off" class="h-full flex flex-col items-center justify-center gap-4">
            <img id="flag-image" src="${state.question.correct.flagUrl}" alt="Flag à deviner" class="w-24 h-16">
            <input id="country-input" type="text" name="countryName" autocomplete="off" spellcheck="false" class="border border-gray-300 rounded-md p-2" placeholder="Quel est le nom de ce pays ?" required autofocus>
            <p id="feedback" class="text-sm font-bold"></p>
        </form>
        <div class="absolute left-0 right-0 bottom-0 border-t border-white/10 bg-black/60 px-4 py-3">
            <p class="text-xs text-gray-300 mb-2">Drapeaux trouvés :</p>
            <div id="found-list" class="flex flex-wrap gap-1"></div>
        </div>
    </div>
    `;

    const form = root.querySelector('form') as HTMLFormElement;
    const input = root.querySelector('#country-input') as HTMLInputElement;
    const feedback = root.querySelector('#feedback') as HTMLParagraphElement;
    const scoreDisplay = root.querySelector('#score') as HTMLDivElement;
    const remainingDisplay = root.querySelector('#remaining') as HTMLDivElement;
    const foundList = root.querySelector('#found-list') as HTMLDivElement;
    const flagImage = root.querySelector('#flag-image') as HTMLImageElement;

    function updateFeedback(message: string, colorClass: string): void {
        if (!feedback) {
            return;
        }

        feedback.textContent = message;
        feedback.className = `text-sm font-bold ${colorClass}`;
    }

    function updateScore(): void {
        if (!scoreDisplay) {
            return;
        }

        scoreDisplay.textContent = getScoreLabel(state.score);
    }

    function updateRemaining(): void {
        if (!remainingDisplay) {
            return;
        }

        remainingDisplay.textContent = `Restants : ${state.remainingCountries.length}`;
    }

    function loadQuestion(): void {
        if (!flagImage) {
            return;
        }

        flagImage.src = state.question.correct.flagUrl;
        flagImage.alt = 'Drapeau du pays à deviner';
        input.value = '';
        input.focus();
        updateFeedback('', 'text-gray-600');
    }

    function renderFoundFlags(): void {
        if (!foundList) {
            return;
        }

        foundList.innerHTML = state.foundCountries
            .map((country) =>
                `<img src="${country.flagUrl}" alt="${country.name}" title="${country.name}" class="w-5 h-4 rounded-sm border border-white/10 object-cover" />`
            )
            .join('');
    }

    function renderEndScreen(): void {
        root.innerHTML = `
            <div class="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-6">
                <div class="text-center">
                    <p class="text-sm uppercase tracking-[0.3em] text-green-400 mb-4">Félicitations !</p>
                    <h1 class="text-4xl font-bold mb-2">Vous avez trouvé tous les drapeaux !</h1>
                    <p class="text-base text-gray-300">Score final : ${state.score} / ${state.foundCountries.length}</p>
                </div>
                <div class="grid grid-cols-6 gap-2 w-full max-w-5xl">
                    ${state.foundCountries
                        .map((country) =>
                            `<div class="flex flex-col items-center gap-1 p-2 bg-white/5 rounded-lg border border-white/10">
                                <img src="${country.flagUrl}" alt="${country.name}" class="w-16 h-12 object-cover rounded-sm" />
                                <span class="text-xs text-gray-200">${country.name}</span>
                            </div>`
                        )
                        .join('')}
                </div>
            </div>
        `;
    }

    function refreshFeedback(): void {
        if (!input.value.trim()) {
            updateFeedback('', 'text-gray-600');
            return;
        }

        const result = getAnswerFeedback(state.question, input.value);

        switch (result) {
            case 'correct':
                state = advanceQuizOnCorrect(state, 4);
                updateScore();
                updateRemaining();
                renderFoundFlags();

                if (state.remainingCountries.length === 0) {
                    renderEndScreen();
                    return;
                }

                updateFeedback('Exact ! Nouvel indice...', 'text-green-600');
                loadQuestion();
                break;
            case 'close':
                updateFeedback('Vous êtes proche !', 'text-yellow-600');
                break;
            case 'wrong':
                updateFeedback('Ce n’est pas la bonne réponse.', 'text-red-600');
                break;
        }
    }

    input.addEventListener('input', refreshFeedback);

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        refreshFeedback();
    });

    renderFoundFlags();
    updateRemaining();
}

