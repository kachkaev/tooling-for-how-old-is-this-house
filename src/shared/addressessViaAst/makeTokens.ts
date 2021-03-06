import { AddressToken, AddressTokenType } from "./types";

const multiCharTokens: Array<[AddressTokenType, (char: string) => boolean]> = [
  [
    "letterSequence",
    (char) => Boolean(char.match(/^\p{L}$/u)), //
  ],
  [
    "numberSequence",
    (char) => Boolean(char >= "0" && char <= "9"), //
  ],
  [
    "spacing",
    (char) =>
      char === " " ||
      char === "_" ||
      char === "\t" ||
      char === "\u00A0" /* nbsp */,
  ],
];

export const makeTokens = (rawAddress: string): AddressToken[] => {
  const result: AddressToken[] = [];
  const address = rawAddress.toLowerCase();
  for (let index = 0; index < address.length; index += 1) {
    const char = address[index]!;
    switch (char) {
      case "(":
      case ")":
        result.push({ value: char, type: "bracket" });
        continue;

      case ",":
        result.push({ value: char, type: "comma" });
        continue;

      case "-":
      case "–": // n-dash
      case "—": // m-dash
      case "−": // minus
        result.push({ value: char, type: "dash" });
        continue;

      case ".":
        result.push({ value: char, type: "period" });
        continue;

      case "/":
        result.push({ value: char, type: "slash" });
        continue;

      case '"':
      case "'":
      case "«":
      case "»":
      case "“":
      case "”":
      case "‘":
      case "’":
        result.push({ value: char, type: "quote" });
        continue;

      case "№":
      case "#":
        result.push({ value: char, type: "numberSign" });
        continue;
    }

    let hasMultiCharToken = false;
    for (const [tokenType, match] of multiCharTokens) {
      if (match(char)) {
        let index2 = index + 1;
        while (address[index2] && match(address[index2]!)) {
          index2 += 1;
        }
        result.push({
          value: address.slice(index, index2),
          type: tokenType,
        });
        hasMultiCharToken = true;
        index = index2 - 1;
      }
    }

    if (hasMultiCharToken) {
      continue;
    }

    result.push({ value: char, type: "unknown" });
  }

  return result;
};
