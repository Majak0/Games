export function isHasardSubmenuPath(pathname: string): boolean {
    return pathname === '/jeux/hasard' || pathname === '/jeux/hasard/';
}

export function isPileOuFacePath(pathname: string): boolean {
    return pathname === '/jeux/hasard/pile-ou-face' || pathname === '/jeux/hasard/pile-ou-face/';
}

export function isBlackjackPath(pathname: string): boolean {
    return pathname === '/jeux/hasard/blackjack' || pathname === '/jeux/hasard/blackjack/';
}
