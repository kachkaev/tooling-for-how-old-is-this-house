export const normalizeSpacing = (name: string): string =>
  name
    .trim()
    .replace(/\s{2,}/g, " ")
    .replace(/№(\d)/g, "№ $1");
