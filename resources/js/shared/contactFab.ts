const FOOTER_GAP_PX = 16;

function placeContactFab(fab: HTMLElement): void {
    const footer = document.querySelector('.arcade-footer');

    if (!footer) {
        fab.style.bottom = '';
        return;
    }

    fab.style.bottom = `${footer.getBoundingClientRect().height + FOOTER_GAP_PX}px`;
}

export function initContactFab(): void {
    const fab = document.getElementById('contact-fab');
    const app = document.getElementById('app');

    if (!fab) {
        return;
    }

    const footerObserver = new ResizeObserver(() => {
        placeContactFab(fab);
    });

    const watchFooter = (): void => {
        footerObserver.disconnect();
        const footer = document.querySelector('.arcade-footer');

        if (footer) {
            footerObserver.observe(footer);
        }

        placeContactFab(fab);
    };

    if (app) {
        new MutationObserver(watchFooter).observe(app, { childList: true });
    }

    window.addEventListener('resize', () => placeContactFab(fab));
    watchFooter();
}
