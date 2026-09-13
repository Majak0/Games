import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { fetchLogoCategories } from './api';
import categorySetupHtml from './templates/html/categorySetup.html?raw';
import categoryCardHtml from './templates/html/categoryCard.html?raw';

const CATEGORY_ICONS: Record<string, string> = {
    nourriture: 'bi-cup-hot-fill',
    informatique: 'bi-cpu-fill',
    vetements: 'bi-handbag-fill',
    automobile: 'bi-car-front-fill',
    'reseaux-sociaux': 'bi-share-fill',
    streaming: 'bi-play-btn-fill',
    finance: 'bi-credit-card-fill',
    commerce: 'bi-shop',
};

function logoCountLabel(count: number): string {
    return count > 1 ? `${count} logos` : `${count} logo`;
}

export async function initLogoCategorySetup(root: HTMLElement): Promise<void> {
    let categories;

    try {
        categories = await fetchLogoCategories();
    } catch {
        mountTemplate(root, fillTemplate(categorySetupHtml, {
            categories: '<p class="col-span-full text-sm text-zinc-400 text-center">Impossible de charger les catégories.</p>',
        }, ['categories']));
        return;
    }

    if (categories.length === 0) {
        mountTemplate(root, fillTemplate(categorySetupHtml, {
            categories: '<p class="col-span-full text-sm text-zinc-400 text-center">Aucune catégorie n’est encore classée. Relancez php artisan logos:categorize.</p>',
        }, ['categories']));
        return;
    }

    const cards = categories
        .map((category) => fillTemplate(categoryCardHtml, {
            href: `/jeux/logo-quiz/categories/${category.id}`,
            icon: CATEGORY_ICONS[category.id] ?? 'bi-tags-fill',
            label: category.label,
            description: logoCountLabel(category.count),
            badge: 'Jouer',
        }))
        .join('');

    mountTemplate(root, fillTemplate(categorySetupHtml, { categories: cards }, ['categories']));
}
