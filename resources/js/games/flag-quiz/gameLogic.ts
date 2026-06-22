import { Country } from '@/types/country';

export interface Question {
    correct: Country;
    choices: Country[];
}

export interface QuizState {
    question: Question;
    score: number;
    remainingCountries: Country[];
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

export function createQuizState(
    countries: Country[],
    numberOfChoices = 4
): QuizState {
    const remainingCountries = [...countries];
    const question = buildQuestion(remainingCountries, numberOfChoices);

    return {
        question,
        score: 0,
        remainingCountries,
        foundCountries: [],
    };
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
    const foundCountries = [...state.foundCountries, state.question.correct];
    const remainingCountries = state.remainingCountries.filter(
        (country) => country.name !== state.question.correct.name
    );

    const question = remainingCountries.length
        ? buildQuestion(remainingCountries, numberOfChoices)
        : state.question;

    return {
        question,
        score: state.score + 1,
        remainingCountries,
        foundCountries,
    };
}

export function getScoreLabel(score: number): string {
    return `Pays trouvés : ${score}`;
}
