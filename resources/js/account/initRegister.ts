import { mountTemplate } from '@/games/shared/template';
import { register } from '@/lib/auth';
import registerHtml from './templates/html/register.html?raw';

export function initRegisterPage(root: HTMLElement): void {
    mountTemplate(root, registerHtml);

    const form = root.querySelector('#register-form') as HTMLFormElement;
    const error = root.querySelector('#register-error') as HTMLParagraphElement;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        error.classList.add('hidden');

        const username = (root.querySelector('#register-username') as HTMLInputElement).value.trim();
        const password = (root.querySelector('#register-password') as HTMLInputElement).value;
        const passwordConfirmation = (root.querySelector('#register-password-confirmation') as HTMLInputElement).value;

        try {
            await register(username, password, passwordConfirmation);
            window.location.href = '/compte';
        } catch (caught) {
            error.textContent = caught instanceof Error ? caught.message : 'Inscription impossible.';
            error.classList.remove('hidden');
        }
    });
}
