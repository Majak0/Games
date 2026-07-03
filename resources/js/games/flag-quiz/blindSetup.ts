import { fillTemplate } from '@/games/shared/fillTemplate';
import { mountTemplate } from '@/games/shared/template';
import { blindPoolOptions } from './modes';
import blindSetupHtml from './templates/html/blindSetup.html?raw';
import blindPoolCardHtml from './templates/html/blindPoolCard.html?raw';

export async function initBlindSetup(root: HTMLElement): Promise<void> {
    const [allResponse, sovereignResponse] = await Promise.all([
        fetch('/api/countries'),
        fetch('/api/countries?pool=sovereign'),
    ]);

    const allCountries = await allResponse.json();
    const sovereignCountries = await sovereignResponse.json();

    const pools = blindPoolOptions
        .map((option) => {
            const count = option.pool === 'sovereign'
                ? sovereignCountries.length
                : allCountries.length;

            return fillTemplate(blindPoolCardHtml, {
                href: `/jeux/flag-quiz/aveugle/${option.id}`,
                label: option.pool === 'sovereign' ? `${count} pays` : `${count} drapeaux`,
                description: option.pool === 'sovereign'
                    ? `${count} pays de la liste officielle, sans indice visuel.`
                    : `${count} drapeaux : tous les pays et dépendances, sans indice visuel.`,
                badge: 'Jouer',
            });
        })
        .join('');

    mountTemplate(root, fillTemplate(blindSetupHtml, { pools }, ['pools']));
}
