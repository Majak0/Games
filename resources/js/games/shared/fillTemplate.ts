function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function fillTemplate(
    template: string,
    values: Record<string, string | number>,
    rawKeys: string[] = []
): string {
    const raw = new Set(rawKeys);

    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
        const value = values[key];

        if (value === undefined) {
            return '';
        }

        const text = String(value);

        return raw.has(key) ? text : escapeHtml(text);
    });
}
