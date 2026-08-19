import { register } from '@/lib/auth';
import { initAuthForm } from './initAuthForm';
import registerHtml from './templates/html/register.html?raw';

export function initRegisterPage(root: HTMLElement): void {
    initAuthForm(root, {
        template: registerHtml,
        formId: 'register-form',
        errorId: 'register-error',
        fieldIds: ['register-username', 'register-password', 'register-password-confirmation'],
        submit: async (values) => {
            await register(
                values['register-username'],
                values['register-password'],
                values['register-password-confirmation'],
            );
        },
        redirectTo: '/compte',
        fallbackError: 'Inscription impossible.',
    });
}
