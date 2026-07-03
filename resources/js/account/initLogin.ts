import { mountTemplate } from '@/games/shared/template';
import { login } from '@/lib/auth';
import loginHtml from './templates/html/login.html?raw';

export function initLoginPage(root: HTMLElement): void {
    mountTemplate(root, loginHtml);

    const form = root.querySelector('#login-form') as HTMLFormElement;
    const error = root.querySelector('#login-error') as HTMLParagraphElement;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        error.classList.add('hidden');

        const username = (root.querySelector('#login-username') as HTMLInputElement).value.trim();
        const password = (root.querySelector('#login-password') as HTMLInputElement).value;

        try {
            await login(username, password);
            window.location.href = '/compte';
        } catch (caught) {
            error.textContent = caught instanceof Error ? caught.message : 'Connexion impossible.';
            error.classList.remove('hidden');
        }
    });
}
