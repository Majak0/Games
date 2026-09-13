import { apiFetch } from '@/lib/api';

export interface FoundLogo {
    name: string;
    visual_url: string;
}

export interface LogoQuizPayload {
    remaining: number;
    score: number;
    completed: boolean;
    visual_url: string | null;
    wordmark: boolean;
    found: FoundLogo[];
}

export interface LogoGuessPayload extends Partial<LogoQuizPayload> {
    result: 'correct' | 'close' | 'wrong';
}

export interface LogoCategory {
    id: string;
    label: string;
    count: number;
}

export function fetchLogoCategories(): Promise<LogoCategory[]> {
    return apiFetch<{ categories: LogoCategory[] }>('/api/logo-quiz/categories')
        .then((payload) => payload.categories);
}

export function startLogoQuiz(options: {
    style: 'flou' | 'nb' | 'color';
    category?: string;
}): Promise<LogoQuizPayload> {
    return apiFetch<LogoQuizPayload>('/api/logo-quiz/start', {
        method: 'POST',
        body: JSON.stringify({
            style: options.style,
            category: options.category ?? null,
        }),
    });
}

export function guessLogo(answer: string): Promise<LogoGuessPayload> {
    return apiFetch<LogoGuessPayload>('/api/logo-quiz/guess', {
        method: 'POST',
        body: JSON.stringify({ answer }),
    });
}

export function skipLogo(): Promise<LogoQuizPayload> {
    return apiFetch<LogoQuizPayload>('/api/logo-quiz/skip', { method: 'POST' });
}
