import { OmitNulls } from "./types";

/**
 * Recursively removes null and undefined values from an object
 * https://stackoverflow.com/a/54707141/1818285
 * TODO: consider refactoring (avoid conversion to string)
 */
export const deepClean = <T>(obj: T): OmitNulls<T> =>
  JSON.parse(
    JSON.stringify(obj, (k, v) =>
      v === null || v === undefined ? undefined : v,
    ),
  );
