import type { CountryQuizGameConfig } from '@/games/shared/countryQuiz/config';

export const flagQuizConfig: CountryQuizGameConfig = {
    visual: 'flag',
    backHref: '/jeux/flag-quiz',
    labels: {
        emptyMessage: 'Aucun drapeau disponible. Lancez le seeder des pays.',
        endCompleteHeading: 'Vous avez trouvé tous les drapeaux !',
        skipButton: 'Passer ce drapeau',
        foundFooter: 'Drapeaux trouvés',
        visualAlt: 'Drapeau du pays à deviner',
        blindTitle: 'Aucun drapeau affiché',
        blindText: 'Tapez un nom de pays : son drapeau apparaîtra ci-dessous une fois trouvé.',
        correctFreeEntry: 'Exact ! Drapeau ajouté.',
        correctNormal: 'Exact ! Nouvel indice...',
        scoreUnitSingular: 'drapeau',
        scoreUnitPlural: 'drapeaux',
    },
};
