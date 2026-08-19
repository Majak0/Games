export interface ModalController {
    open: () => void;
    close: () => void;
    bindCloseTriggers: (selector: string) => void;
}

export function createModalController(modal: HTMLElement): ModalController {
    function onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            close();
        }
    }

    function open(): void {
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('arcade-modal-open');
        window.addEventListener('keydown', onKeydown);
    }

    function close(): void {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('arcade-modal-open');
        window.removeEventListener('keydown', onKeydown);
    }

    function bindCloseTriggers(selector: string): void {
        modal.querySelectorAll(selector).forEach((element) => {
            element.addEventListener('click', () => {
                close();
            });
        });
    }

    return { open, close, bindCloseTriggers };
}
