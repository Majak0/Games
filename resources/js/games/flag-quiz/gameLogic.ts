import { Country } from '@/types/country';

export interface Question {
    correct: Country;
    choices: Country[];
}

export function buildQuestion(
    countries: Country[],
    numberOfChoices: number
): Question {
    const correct =
        countries[Math.floor(Math.random() * countries.length)];

    return {
        correct,
        choices: [correct],
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
                matrix[i][j] = Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]) + 1;
            }
        }
    }
    return matrix[a.length][b.length];
}

export function getAnswerFeedback(
    question: Question,
    userAnswer: string
): 'correct' | 'close' | 'wrong' {
    const distance = levenshtein(normalize(userAnswer), normalize(question.correct.name));
    if (distance === 0) {
        return 'correct';
    }
    return 'wrong';
}