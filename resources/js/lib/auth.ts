import { apiFetch } from '@/lib/api';

export interface AuthUser {
    id: number;
    username: string;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
    const response = await apiFetch<{ user: AuthUser | null }>('/api/auth/me');

    return response.user;
}

export async function login(username: string, password: string): Promise<AuthUser> {
    const response = await apiFetch<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

    return response.user;
}

export async function register(username: string, password: string, passwordConfirmation: string): Promise<AuthUser> {
    const response = await apiFetch<{ user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            username,
            password,
            password_confirmation: passwordConfirmation,
        }),
    });

    return response.user;
}

export async function logout(): Promise<void> {
    await apiFetch('/api/auth/logout', { method: 'POST' });
}
