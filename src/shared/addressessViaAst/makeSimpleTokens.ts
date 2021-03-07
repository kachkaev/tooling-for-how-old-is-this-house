import { SimpleAddressToken, SimpleAddressTokenType } from "./types";

const multiCharTokens: Array<
  [SimpleAddressTokenType, (char: string) => boolean]
> = [
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

export const makeSimpleTokens = (rawAddress: string): SimpleAddressToken[] => {
  const result: SimpleAddressToken[] = [];
  const address = rawAddress.toLowerCase();
  for (let index = 0; index < address.length; index += 1) {
    const char = address[index]!;
    switch (char) {
      case "(":
      case ")":
        result.push(["bracket", char]);
        continue;

      case ",":
        result.push(["comma", char]);
        continue;

      case "-":
      case "–": // n-dash
      case "—": // m-dash
      case "−": // minus
        result.push(["dash", char]);
        continue;

      case ".":
        result.push(["period", char]);
        continue;

      case "/":
      case "\\":
        result.push(["slash", char]);
        continue;

      case '"':
      case "'":
      case "«":
      case "»":
      case "“":
      case "”":
      case "‘":
      case "’":
        result.push(["quote", char]);
        continue;

      case "№":
      case "#":
        result.push(["numberSign", char]);
        continue;
    }

    let hasMultiCharToken = false;
    for (const [tokenType, match] of multiCharTokens) {
      if (match(char)) {
        let index2 = index + 1;
        while (address[index2] && match(address[index2]!)) {
          index2 += 1;
        }
        result.push([tokenType, address.slice(index, index2)]);
        hasMultiCharToken = true;
        index = index2 - 1;
      }
    }

    if (hasMultiCharToken) {
      continue;
    }

    result.push(["unknown", char]);
  }

  return result;
};
