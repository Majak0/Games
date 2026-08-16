function getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    if (meta) {
        return meta;
    }

    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (options.method && options.method !== 'GET') {
        headers.set('X-CSRF-TOKEN', getCsrfToken());
    }

    const response = await fetch(path, {
        ...options,
        credentials: 'same-origin',
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = typeof data.message === 'string'
            ? data.message
            : 'Une erreur est survenue.';

        throw new Error(message);
    }

    return data as T;
}
