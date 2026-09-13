import { fetchCurrentUser } from '@/lib/auth';
import { normalizePath } from '@/shared/path';

function isNavOpen(nav: HTMLElement): boolean {
    return nav.classList.contains('is-open');
}

function setToggleIcon(toggle: HTMLButtonElement, open: boolean): void {
    const icon = toggle.querySelector('i');

    if (icon) {
        icon.className = open ? 'bi bi-x-lg' : 'bi bi-list';
    }

    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
}

function markCurrentLink(nav: HTMLElement): void {
    const path = normalizePath(window.location.pathname);

    nav.querySelectorAll<HTMLAnchorElement>('[data-nav]').forEach((link) => {
        const section = link.dataset.nav;
        const current = section === 'games'
            ? path === '/' || path.startsWith('/jeux')
            : section === 'account'
                ? path.startsWith('/compte')
                : path === '/contact';

        link.classList.toggle('is-current', current);

        if (current) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

async function hydrateAccountLink(nav: HTMLElement): Promise<void> {
    const link = nav.querySelector<HTMLAnchorElement>('#site-nav-account');
    const label = nav.querySelector('#site-nav-account-label');
    const meta = nav.querySelector('#site-nav-account-meta');
    const icon = link?.querySelector('i');

    if (!link || !label || !meta || !icon) {
        return;
    }

    const user = await fetchCurrentUser();

    if (user) {
        link.href = '/compte';
        label.textContent = 'Profil';
        meta.textContent = user.username;
        meta.hidden = false;
        icon.className = 'bi bi-person-fill';
        link.classList.add('arcade-site-nav__link--connected');
    } else {
        link.href = '/compte/connexion';
        label.textContent = 'Connexion';
        meta.textContent = '';
        meta.hidden = true;
        icon.className = 'bi bi-box-arrow-in-right';
        link.classList.remove('arcade-site-nav__link--connected');
    }
}

export async function initSiteNav(): Promise<void> {
    const nav = document.getElementById('site-nav');
    const toggle = document.getElementById('site-nav-toggle');
    const backdrop = document.getElementById('site-nav-backdrop');
    const drawer = document.getElementById('site-nav-drawer');

    if (
        !(nav instanceof HTMLElement)
        || !(toggle instanceof HTMLButtonElement)
        || !(backdrop instanceof HTMLElement)
        || !(drawer instanceof HTMLElement)
    ) {
        return;
    }

    const firstLink = (): HTMLAnchorElement | null => drawer.querySelector('a');

    const focusable = (): HTMLElement[] => (
        [toggle, ...drawer.querySelectorAll<HTMLElement>('a')]
    );

    const open = (): void => {
        nav.classList.add('is-open');
        document.body.classList.add('arcade-nav-open');
        drawer.inert = false;
        drawer.setAttribute('aria-hidden', 'false');
        backdrop.removeAttribute('hidden');
        setToggleIcon(toggle, true);
        window.setTimeout(() => firstLink()?.focus(), 0);
    };

    const closeNav = (): void => {
        nav.classList.remove('is-open');
        document.body.classList.remove('arcade-nav-open');
        drawer.inert = true;
        drawer.setAttribute('aria-hidden', 'true');
        backdrop.setAttribute('hidden', '');
        setToggleIcon(toggle, false);
        toggle.focus();
    };

    toggle.addEventListener('click', () => {
        if (isNavOpen(nav)) {
            closeNav();
            return;
        }

        open();
    });

    backdrop.addEventListener('click', closeNav);

    window.addEventListener('keydown', (event) => {
        if (!isNavOpen(nav)) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeNav();
            return;
        }

        if (event.key !== 'Tab') {
            return;
        }

        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];

        if (!first || !last) {
            return;
        }

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    markCurrentLink(nav);
    await hydrateAccountLink(nav);
    markCurrentLink(nav);
}
