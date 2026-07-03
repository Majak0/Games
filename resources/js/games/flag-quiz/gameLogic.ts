import { Country } from '@/types/country';

export interface Question {
    correct: Country;
    choices: Country[];
}

export interface QuizState {
    question: Question;
    score: number;
    currentPool: Country[];
    passedCountries: Country[];
    foundCountries: Country[];
}

export type Feedback = 'correct' | 'close' | 'wrong';

export function buildQuestion(
    countries: Country[],
    numberOfChoices = 4
): Question {
    const correct = countries[Math.floor(Math.random() * countries.length)];

    return {
        correct,
        choices: [correct],
    };
}

function refillCurrentPoolFromPassed(state: QuizState): QuizState {
    if (state.currentPool.length > 0 || state.passedCountries.length === 0) {
        return state;
    }

    return {
        ...state,
        currentPool: [...state.passedCountries],
        passedCountries: [],
    };
}

function pickNextQuestion(state: QuizState, numberOfChoices = 4): Question {
    const pool = refillCurrentPoolFromPassed(state).currentPool;

    return buildQuestion(pool, numberOfChoices);
}

export function createQuizState(
    countries: Country[],
    numberOfChoices = 4
): QuizState {
    const currentPool = [...countries];
    const question = buildQuestion(currentPool, numberOfChoices);

    return {
        question,
        score: 0,
        currentPool,
        passedCountries: [],
        foundCountries: [],
    };
}

export function getRemainingCount(state: QuizState): number {
    return state.currentPool.length + state.passedCountries.length;
}

export function isQuizComplete(state: QuizState): boolean {
    return getRemainingCount(state) === 0;
}

function normalize(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function checkAnswer(question: Question, userAnswer: string): boolean {
    return normalize(userAnswer) === normalize(question.correct.name);
}

function levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) {
        matrix[i][0] = i;
    }

    for (let j = 0; j <= b.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j],
                    matrix[i][j - 1],
                    matrix[i - 1][j - 1]
                ) + 1;
            }
        }
    }

    return matrix[a.length][b.length];
}

export function getAnswerFeedback(
    question: Question,
    userAnswer: string
): Feedback {
    const normalizedAnswer = normalize(userAnswer);
    const normalizedCorrect = normalize(question.correct.name);
    const distance = levenshtein(normalizedAnswer, normalizedCorrect);

    if (distance === 0) {
        return 'correct';
    }

    const closeThreshold = Math.max(1, Math.min(2, Math.floor(normalizedCorrect.length * 0.25)));
    if (distance <= closeThreshold) {
        return 'close';
    }

    return 'wrong';
}

export function advanceQuizOnCorrect(
    state: QuizState,
    numberOfChoices = 4
): QuizState {
    const found = state.question.correct;
    let nextState: QuizState = {
        ...state,
        score: state.score + 1,
        foundCountries: [...state.foundCountries, found],
        currentPool: state.currentPool.filter((country) => country.name !== found.name),
    };

    nextState = refillCurrentPoolFromPassed(nextState);

    return {
        ...nextState,
        question: isQuizComplete(nextState)
            ? nextState.question
            : pickNextQuestion(nextState, numberOfChoices),
    };
}

export function skipCurrentFlag(
    state: QuizState,
    numberOfChoices = 4
): QuizState {
    const skipped = state.question.correct;
    let nextState: QuizState = {
        ...state,
        currentPool: state.currentPool.filter((country) => country.name !== skipped.name),
        passedCountries: [...state.passedCountries, skipped],
    };

    nextState = refillCurrentPoolFromPassed(nextState);

    return {
        ...nextState,
        question: pickNextQuestion(nextState, numberOfChoices),
    };
}

export function getRemainingCountries(state: QuizState): Country[] {
    return [...state.currentPool, ...state.passedCountries];
}

export function findExactCountryMatch(input: string, countries: Country[]): Country | null {
    const normalizedAnswer = normalize(input);

    return countries.find((country) => normalize(country.name) === normalizedAnswer) ?? null;
}

export type FreeEntryFeedback = Feedback | 'already-found';

export function getFreeEntryFeedback(state: QuizState, userAnswer: string): FreeEntryFeedback {
    if (findExactCountryMatch(userAnswer, state.foundCountries)) {
        return 'already-found';
    }

    const remaining = getRemainingCountries(state);

    if (findExactCountryMatch(userAnswer, remaining)) {
        return 'correct';
    }

    for (const country of remaining) {
        if (getAnswerFeedback({ correct: country, choices: [country] }, userAnswer) === 'close') {
            return 'close';
        }
    }

    return 'wrong';
}

export function advanceQuizOnFreeEntry(
    state: QuizState,
    country: Country,
    numberOfChoices = 4
): QuizState {
    let nextState: QuizState = {
        ...state,
        score: state.score + 1,
        foundCountries: [...state.foundCountries, country],
        currentPool: state.currentPool.filter((entry) => entry.name !== country.name),
        passedCountries: state.passedCountries.filter((entry) => entry.name !== country.name),
    };

    nextState = refillCurrentPoolFromPassed(nextState);

    return {
        ...nextState,
        question: isQuizComplete(nextState)
            ? nextState.question
            : pickNextQuestion(nextState, numberOfChoices),
    };
}

export function getScoreLabel(score: number): string {
    return `Trouvés : ${score}`;
}
