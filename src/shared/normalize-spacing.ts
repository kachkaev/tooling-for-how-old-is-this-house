export const normalizeSpacing = (value: string): string =>
  value
    .trim()
    .replace(/\s{2,}/g, " ")
    .replace(/№(\d)/g, "№ $1");
