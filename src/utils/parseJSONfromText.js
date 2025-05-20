export function parseJSONfromText(raw) {
    try {
        const match = raw.match(/{[\s\S]*}/);
        if (!match) return null;
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}