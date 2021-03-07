import { AddressToken, SimpleAddressToken } from "./types";

export const makeTokens = (
  simpleTokens: SimpleAddressToken[],
): AddressToken[] => {
  const result: AddressToken[] = [];
  let wordIsOpen = false;
  for (let index = 0; index < simpleTokens.length; index += 1) {
    const token = simpleTokens[index]!;
    const { type: tokenType, value: tokenValue } = token;

    const openWord = wordIsOpen ? result[result.length - 1] : undefined;
    if (openWord) {
      const { type: openWordType } = openWord;

      const nextToken = simpleTokens[index + 1];
      const { type: nextTokenType, value: nextTokenValue } = nextToken ?? {};

      // что-то.
      if (tokenType === "period") {
        openWord.type = "protoWord";
        openWord.value += tokenValue;
        wordIsOpen = false;
        continue;
      }

      // такой-то
      if (
        openWordType === "letterSequence" &&
        tokenType === "dash" &&
        nextTokenType === "letterSequence"
      ) {
        openWord.type = "protoWord";
        openWord.value += tokenValue + nextTokenValue;
        index += 1;
        continue;
      }

      // с/т
      if (
        openWordType === "letterSequence" &&
        tokenType === "slash" &&
        nextTokenType === "letterSequence"
      ) {
        openWord.type = "protoWord";
        openWord.value += tokenValue + nextTokenValue;
        index += 1;
        continue;
      }

      // 42-й
      if (
        openWordType === "numberSequence" &&
        tokenType === "dash" &&
        nextTokenType === "letterSequence"
      ) {
        openWord.type = "protoWord";
        openWord.value += tokenValue + nextTokenValue;
        index += 1;
        continue;
      }

      // 41А или 1ый (но не 10к10)
      if (
        openWordType === "numberSequence" &&
        tokenType === "letterSequence" &&
        nextTokenType !== "numberSequence"
      ) {
        openWord.type = "protoWord";
        openWord.value += tokenValue;
        continue;
      }

      wordIsOpen = false;
    } else {
      if (tokenType === "numberSequence" || tokenType === "letterSequence") {
        wordIsOpen = true;
      }
    }

    result.push(token);
  }

  return result;
};
