export function bindElements<M extends Record<string, string>>(
    root: ParentNode,
    selectors: M,
): { [K in keyof M]: HTMLElement } | null {
    const elements = {} as Record<string, HTMLElement | null>;

    for (const key of Object.keys(selectors) as (keyof M)[]) {
        elements[key as string] = root.querySelector(String(selectors[key]));

        if (!elements[key as string]) {
            return null;
        }
    }

    return elements as { [K in keyof M]: HTMLElement };
}
