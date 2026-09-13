import { mountApp } from '@/router';
import { initSiteNav } from '@/shared/siteNav';

document.addEventListener('DOMContentLoaded', async () => {
    await initSiteNav();

    const root = document.getElementById('app');

    if (root) {
        await mountApp(root);
    }
});
