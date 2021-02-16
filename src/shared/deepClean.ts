/**
 * Recursively removes null and undefined values from an object
 * https://stackoverflow.com/a/54707141/1818285
 * TODO: consider refactoring
 */
export const deepClean = <T>(obj: T): T =>
  JSON.parse(
    JSON.stringify(obj, (k, v) =>
      v === null || v === undefined ? undefined : v,
    ),
  );
