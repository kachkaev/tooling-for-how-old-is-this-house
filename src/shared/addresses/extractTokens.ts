import { extractAtomicTokens } from "./extractAtomicTokens";
import { AddressToken } from "./types";

export const extractTokens = (rawAddress: string): AddressToken[] => {
  const atomicTokens = extractAtomicTokens(rawAddress);

  const result: AddressToken[] = [];
  let wordIsOpen = false;
  for (let index = 0; index < atomicTokens.length; index += 1) {
    const token = atomicTokens[index]!;
    const [tokenType, tokenValue] = token;

    const openWord = wordIsOpen ? result[result.length - 1] : undefined;
    if (openWord) {
      const [openWordType, openWordValue] = openWord;

      const nextToken = atomicTokens[index + 1];
      const [nextTokenType, nextTokenValue] = nextToken ?? [];

      // что-то.
      if (tokenType === "period") {
        openWord[0] = "protoWord";
        openWord[1] += tokenValue;
        wordIsOpen = false;
        continue;
      }

      // с/т
      if (
        openWordType === "letterSequence" &&
        openWordValue.length < 3 &&
        tokenType === "slash" &&
        nextTokenType === "letterSequence" &&
        nextTokenValue &&
        nextTokenValue.length < 3
      ) {
        openWord[0] = "protoWord";
        openWord[1] += `/${nextTokenValue}`;
        index += 1;
        continue;
      }

      // такой-то
      if (
        openWordType === "letterSequence" &&
        tokenType === "dash" &&
        nextTokenType === "letterSequence"
      ) {
        openWord[0] = "protoWord";
        openWord[1] += `-${nextTokenValue}`;
        index += 1;
        continue;
      }

      // 42-й
      if (
        openWordType === "numberSequence" &&
        tokenType === "dash" &&
        nextTokenType === "letterSequence"
      ) {
        openWord[0] = "protoWord";
        openWord[1] += `-${nextTokenValue}`;
        index += 1;
        continue;
      }

      // 41А или 1ый (но не 10к10)
      if (
        openWordType === "numberSequence" &&
        tokenType === "letterSequence" &&
        nextTokenType !== "numberSequence"
      ) {
        openWord[0] = "protoWord";
        openWord[1] += tokenValue;
        continue;
      }

      wordIsOpen = false;
    } else {
      // TODO: Improve logic (handle "&quot;" as one token)
      if (tokenType === "letterSequence" && tokenValue === "quot") {
        result.push(["quote", tokenValue]);
        continue;
      }
      if (tokenType === "numberSequence" || tokenType === "letterSequence") {
        wordIsOpen = true;
      }
    }

    result.push(token);
  }

  return result;
};
