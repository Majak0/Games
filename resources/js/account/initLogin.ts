import { login } from '@/lib/auth';
import { initAuthForm } from './initAuthForm';
import loginHtml from './templates/html/login.html?raw';

export function initLoginPage(root: HTMLElement): void {
    initAuthForm(root, {
        template: loginHtml,
        formId: 'login-form',
        errorId: 'login-error',
        fieldIds: ['login-username', 'login-password'],
        submit: async (values) => {
            await login(values['login-username'], values['login-password']);
        },
        redirectTo: '/compte',
        fallbackError: 'Connexion impossible.',
    });
}
