export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    suit: Suit;
    rank: Rank;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
    const deck: Card[] = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }

    return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
}

export function handValue(cards: Card[]): number {
    let total = 0;
    let aces = 0;

    for (const card of cards) {
        if (card.rank === 'A') {
            aces += 1;
            total += 11;
        } else if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') {
            total += 10;
        } else {
            total += Number(card.rank);
        }
    }

    while (total > 21 && aces > 0) {
        total -= 10;
        aces -= 1;
    }

    return total;
}

const TEN_VALUE_RANKS: Rank[] = ['10', 'J', 'Q', 'K'];

export function isBlackjack(cards: Card[]): boolean {
    if (cards.length !== 2) {
        return false;
    }

    const ranks = cards.map((card) => card.rank);
    const hasAce = ranks.includes('A');
    const hasTenValue = ranks.some((rank) => TEN_VALUE_RANKS.includes(rank));

    return hasAce && hasTenValue;
}

export function isMaximumTwentyOne(cards: Card[]): boolean {
    return cards.length > 0 && handValue(cards) === 21 && !isBlackjack(cards);
}

export function suitSymbol(suit: Suit): string {
    switch (suit) {
        case 'hearts':
            return '♥';
        case 'diamonds':
            return '♦';
        case 'clubs':
            return '♣';
        case 'spades':
            return '♠';
    }
}

export function suitClass(suit: Suit): string {
    return suit === 'hearts' || suit === 'diamonds' ? 'arcade-card--red' : 'arcade-card--black';
}

export function drawCard(deck: Card[]): Card | null {
    return deck.pop() ?? null;
}
