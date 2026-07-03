import type { CountryQuizGameConfig } from '@/games/shared/countryQuiz/config';

export const shapeQuizConfig: CountryQuizGameConfig = {
    visual: 'shape',
    backHref: '/jeux/shape-quiz',
    labels: {
        emptyMessage: 'Aucune forme de pays disponible. Lancez le seeder des pays.',
        endCompleteHeading: 'Vous avez trouvé toutes les formes !',
        skipButton: 'Passer ce pays',
        foundFooter: 'Formes trouvées',
        visualAlt: 'Forme du pays à deviner',
        blindTitle: 'Aucune forme affichée',
        blindText: 'Tapez un nom de pays : sa forme apparaîtra ci-dessous une fois trouvée.',
        correctFreeEntry: 'Exact ! Forme ajoutée.',
        correctNormal: 'Exact ! Nouvelle forme...',
        scoreUnitSingular: 'pays',
        scoreUnitPlural: 'pays',
    },
};
