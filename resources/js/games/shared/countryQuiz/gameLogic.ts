import { Country } from '@/types/country';

export interface Question {
    correct: Country;
}

export interface QuizState {
    question: Question;
    score: number;
    currentPool: Country[];
    passedCountries: Country[];
    foundCountries: Country[];
}

export type Feedback = 'correct' | 'close' | 'wrong';

function buildQuestion(countries: Country[]): Question {
    const correct = countries[Math.floor(Math.random() * countries.length)];

    return { correct };
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

function pickNextQuestion(state: QuizState): Question {
    const pool = refillCurrentPoolFromPassed(state).currentPool;

    return buildQuestion(pool);
}

export function createQuizState(countries: Country[]): QuizState {
    const currentPool = [...countries];
    const question = buildQuestion(currentPool);

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
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['’`-]/g, ' ')
        .replace(/\s+/g, ' ');
}

function matchesCountryInput(country: Country, normalizedAnswer: string): boolean {
    if (normalize(country.name) === normalizedAnswer) {
        return true;
    }

    return (country.synonyms ?? []).some((synonym) => normalize(synonym) === normalizedAnswer);
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

    if (matchesCountryInput(question.correct, normalizedAnswer)) {
        return 'correct';
    }

    const normalizedCorrect = normalize(question.correct.name);
    const distance = levenshtein(normalizedAnswer, normalizedCorrect);
    const closeThreshold = Math.max(1, Math.min(2, Math.floor(normalizedCorrect.length * 0.25)));
    if (distance <= closeThreshold) {
        return 'close';
    }

    return 'wrong';
}

export function advanceQuizOnCorrect(state: QuizState): QuizState {
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
            : pickNextQuestion(nextState),
    };
}

export function skipCurrentFlag(state: QuizState): QuizState {
    const skipped = state.question.correct;
    let nextState: QuizState = {
        ...state,
        currentPool: state.currentPool.filter((country) => country.name !== skipped.name),
        passedCountries: [...state.passedCountries, skipped],
    };

    nextState = refillCurrentPoolFromPassed(nextState);

    return {
        ...nextState,
        question: pickNextQuestion(nextState),
    };
}

export function getRemainingCountries(state: QuizState): Country[] {
    return [...state.currentPool, ...state.passedCountries];
}

export function findExactCountryMatch(input: string, countries: Country[]): Country | null {
    const normalizedAnswer = normalize(input);

    return countries.find((country) => matchesCountryInput(country, normalizedAnswer)) ?? null;
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
        if (getAnswerFeedback({ correct: country }, userAnswer) === 'close') {
            return 'close';
        }
    }

    return 'wrong';
}

export function advanceQuizOnFreeEntry(state: QuizState, country: Country): QuizState {
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
            : pickNextQuestion(nextState),
    };
}

export function getScoreLabel(score: number): string {
    return `Trouvés : ${score}`;
}
