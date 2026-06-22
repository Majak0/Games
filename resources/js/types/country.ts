export interface Country {
    id: number;
    name: string;
    flagUrl: string;
}

export interface Question {
    correct: Country;
    choices: Country[];
}
