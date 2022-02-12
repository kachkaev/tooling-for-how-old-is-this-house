import { extractAtomicTokens } from "./extract-atomic-tokens";
import { simplifySpelling } from "./helpers-for-words";
import { AddressToken } from "./types";

export const extractTokens = (rawAddress: string): AddressToken[] => {
  const atomicTokens = extractAtomicTokens(rawAddress).map(
    ([tokenType, tokenValue]) =>
      [tokenType, simplifySpelling(tokenValue)] as AddressToken,
  );

  const result: AddressToken[] = [];
  let wordIsOpen = false;
  for (let index = 0; index < atomicTokens.length; index += 1) {
    const token = atomicTokens[index]!;
    const [tokenType, tokenValue] = token;

    const openWord = wordIsOpen ? result[result.length - 1] : undefined;
    if (openWord) {
      const [openWordType, openWordValue] = openWord;

      // что-то.
      if (tokenType === "period") {
        openWord[0] = "protoWord";
        openWord[1] += tokenValue;
        wordIsOpen = false;
        continue;
      }

      const nextToken = atomicTokens[index + 1];
      if (nextToken) {
        const [nextTokenType, nextTokenValue] = nextToken;

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
      }

      // 41А или 1ый (но не 10к10)
      if (
        openWordType === "numberSequence" &&
        tokenType === "letterSequence" &&
        nextToken?.[0] !== "numberSequence"
      ) {
        openWord[0] = "protoWord";
        openWord[1] += tokenValue;
        continue;
      }

      wordIsOpen = false;
    } else {
      if (
        tokenType === "letterSequence" &&
        (tokenValue === "дубль" || tokenValue === "дробь")
      ) {
        result.push(["slash", "/"]);
        continue;
      }

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
