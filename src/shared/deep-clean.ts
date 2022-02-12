import { OmitNullable } from "./types";

/**
 * Recursively removes null and undefined values from an object
 * https://stackoverflow.com/a/54707141/1818285
 * TODO: consider refactoring (avoid conversion to string)
 */
export const deepClean = <T>(obj: T): OmitNullable<T> =>
  JSON.parse(
    JSON.stringify(obj, (key, value: unknown) =>
      value === null || value === undefined ? undefined : value,
    ),
  ) as OmitNullable<T>;
