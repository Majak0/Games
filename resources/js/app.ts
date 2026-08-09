import { mountApp } from '@/router';
import { initAccountFab } from '@/shared/accountFab';

document.addEventListener('DOMContentLoaded', async () => {
    await initAccountFab();

    const root = document.getElementById('app');

    if (root) {
        await mountApp(root);
    }
});
