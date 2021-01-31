/**
 * Returns a chunk of a cadastral number
 *
 * @example ("42:02:1234567:123", 0, 1, "-") => "42:02"
 */
export const getCnChunk = (
  cn: string,
  firstIndex: number,
  lastIndex: number = firstIndex + 1,
  separator: string = ":",
): string => {
  return cn.split(":").slice(firstIndex, lastIndex).join(separator);
};

/**
 * Removes leading zeros in a given cadastral number.
 * The result equals to the internal id used by rosreestr.gov.ru/api
 *
 * @example ("42:02:0000012:42") => "42:2:12:42"
 */
export const convertCnToId = (cn: string): string => {
  return cn
    .split(":")
    .map((part) => `${parseInt(part)}`)
    .join(":");
};
