import { mountTemplate } from '@/games/shared/template';

interface AuthFormConfig {
    template: string;
    formId: string;
    errorId: string;
    fieldIds: string[];
    submit: (values: Record<string, string>) => Promise<void>;
    redirectTo: string;
    fallbackError: string;
}

export function initAuthForm(root: HTMLElement, config: AuthFormConfig): void {
    mountTemplate(root, config.template);

    const form = root.querySelector(`#${config.formId}`) as HTMLFormElement | null;
    const error = root.querySelector(`#${config.errorId}`) as HTMLParagraphElement | null;

    if (!form || !error) {
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        error.classList.add('hidden');

        const values = Object.fromEntries(
            config.fieldIds.map((fieldId) => {
                const input = root.querySelector(`#${fieldId}`) as HTMLInputElement;

                return [fieldId, input?.value.trim() ?? ''];
            }),
        );

        try {
            await config.submit(values);
            window.location.href = config.redirectTo;
        } catch (caught) {
            error.textContent = caught instanceof Error ? caught.message : config.fallbackError;
            error.classList.remove('hidden');
        }
    });
}
