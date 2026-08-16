import { mountTemplate } from '@/games/shared/template';
import { apiFetch } from '@/lib/api';
import contactHtml from './templates/html/contact.html?raw';

const MAX_FILES = 3;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export function initContactPage(root: HTMLElement): void {
    mountTemplate(root, contactHtml);

    const form = root.querySelector('#contact-form') as HTMLFormElement;
    const subject = root.querySelector('#contact-subject') as HTMLSelectElement;
    const customWrap = root.querySelector('#contact-subject-custom-wrap') as HTMLLabelElement;
    const customSubject = root.querySelector('#contact-subject-custom') as HTMLInputElement;
    const email = root.querySelector('#contact-email') as HTMLInputElement;
    const copySender = root.querySelector('#contact-copy') as HTMLInputElement;
    const message = root.querySelector('#contact-message') as HTMLTextAreaElement;
    const attachments = root.querySelector('#contact-attachments') as HTMLInputElement;
    const fileList = root.querySelector('#contact-file-list') as HTMLParagraphElement;
    const error = root.querySelector('#contact-error') as HTMLParagraphElement;
    const success = root.querySelector('#contact-success') as HTMLParagraphElement;
    const submit = root.querySelector('#contact-submit') as HTMLButtonElement;

    const defaultFileHint = fileList.textContent ?? '';

    const refreshSubjectValidity = (): void => {
        subject.setCustomValidity(subject.value === '' ? 'Choisir un objet' : '');
    };

    const toggleCustomSubject = (): void => {
        const isOther = subject.value === 'autre';
        customWrap.classList.toggle('hidden', !isOther);
        customSubject.required = isOther;
        refreshSubjectValidity();
    };

    const toggleCopyEmail = (): void => {
        email.required = copySender.checked;
    };

    const selectedFiles = (): File[] => Array.from(attachments.files ?? []);

    const refreshFileList = (): void => {
        const files = selectedFiles();

        if (files.length === 0) {
            fileList.textContent = defaultFileHint;
            return;
        }

        fileList.textContent = files.map((file) => file.name).join(', ');
    };

    const showError = (text: string): void => {
        success.classList.add('hidden');
        error.textContent = text;
        error.classList.remove('hidden');
    };

    subject.addEventListener('change', toggleCustomSubject);
    subject.addEventListener('invalid', refreshSubjectValidity);
    copySender.addEventListener('change', toggleCopyEmail);
    attachments.addEventListener('change', refreshFileList);
    refreshSubjectValidity();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        error.classList.add('hidden');
        success.classList.add('hidden');

        const files = selectedFiles();

        if (files.length > MAX_FILES) {
            showError('Vous pouvez joindre au plus 3 fichiers.');
            return;
        }

        if (files.some((file) => file.size > MAX_FILE_BYTES)) {
            showError('Chaque fichier ne doit pas dépasser 4 Mo.');
            return;
        }

        const payload = new FormData();
        payload.append('subject', subject.value);
        payload.append('subject_custom', customSubject.value.trim());
        payload.append('message', message.value.trim());
        payload.append('email', email.value.trim());
        payload.append('copy_sender', copySender.checked ? '1' : '0');
        files.forEach((file) => payload.append('attachments[]', file));

        submit.disabled = true;

        try {
            const result = await apiFetch<{ ok: boolean; message: string }>('/api/contact', {
                method: 'POST',
                body: payload,
            });

            error.classList.add('hidden');
            success.textContent = result.message;
            success.classList.remove('hidden');
            form.reset();
            subject.selectedIndex = 0;
            toggleCustomSubject();
            toggleCopyEmail();
            refreshFileList();
        } catch (caught) {
            showError(caught instanceof Error ? caught.message : 'Envoi impossible.');
        } finally {
            submit.disabled = false;
        }
    });
}
