import { fetchCurrentUser } from '@/lib/auth';

export async function initAccountFab(): Promise<void> {
    const root = document.getElementById('account-fab');

    if (!root) {
        return;
    }

    const user = await fetchCurrentUser();
    const href = user ? '/compte' : '/compte/connexion';
    const label = user ? `Compte : ${user.username}` : 'Se connecter';

    root.innerHTML = `
        <a href="${href}" class="arcade-account-fab${user ? ' arcade-account-fab--connected' : ''}" title="${label}" aria-label="${label}">
            <i class="bi bi-person-fill" aria-hidden="true"></i>
        </a>`;
}
