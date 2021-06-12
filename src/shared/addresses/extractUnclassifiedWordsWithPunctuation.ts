import { extractTokens } from "./extractTokens";
import {
  AddressNodeWithSeparator,
  AddressNodeWithUnclassifiedWord,
  AddressToken,
  AddressTokenType,
} from "./types";

const wordTokensSet = new Set<AddressTokenType>([
  "letterSequence",
  "numberSequence",
  "protoWord",
]);

const separatorTokensSet = new Set<AddressTokenType>([
  "bracket",
  "comma",
  "dash",
  "slash",
]);

export const extractUnclassifiedWordsWithPunctuation = (
  rawAddress: string,
): Array<AddressNodeWithUnclassifiedWord | AddressNodeWithSeparator> => {
  const tokens = extractTokens(rawAddress);
  // Filter tokens, combine and reduce the variety of separators
  const filteredTokens: AddressToken[] = [];
  for (const [tokenType, tokenValue] of tokens) {
    if (wordTokensSet.has(tokenType)) {
      filteredTokens.push([tokenType, tokenValue]);

      continue;
    }

    if (separatorTokensSet.has(tokenType)) {
      const lastFilteredToken = filteredTokens[filteredTokens.length - 1];

      // Combine separators
      if (lastFilteredToken && separatorTokensSet.has(lastFilteredToken[0])) {
        lastFilteredToken[0] = "comma";
        lastFilteredToken[1] = ",";

        continue;
      }

      // treat brackets as commas
      if ([tokenType, tokenValue][0] === "bracket") {
        filteredTokens.push(["comma", ","]);

        continue;
      }

      filteredTokens.push([tokenType, tokenValue]);
    }
  }

  // Trim separators
  while (filteredTokens[0] && separatorTokensSet.has(filteredTokens[0]![0])) {
    filteredTokens.shift();
  }
  while (
    filteredTokens[filteredTokens.length - 1] &&
    separatorTokensSet.has(filteredTokens[filteredTokens.length - 1]![0])
  ) {
    filteredTokens.pop();
  }

  // Generate initial nodes
  const nodes: Array<
    AddressNodeWithUnclassifiedWord | AddressNodeWithSeparator
  > = [];
  for (const [tokenType, tokenValue] of filteredTokens) {
    if (wordTokensSet.has(tokenType)) {
      nodes.push({
        nodeType: "word",
        wordType: "unclassified",
        value: tokenValue,
      });
      continue;
    }

    nodes.push({
      nodeType: "separator",
      separatorType:
        tokenType === "slash" || tokenType === "dash" ? tokenType : "comma",
    });
  }

  // Stitch [NN]-[WW] into a single token. Examples: '42 - А', "улица 30 - летия победы"
  for (let index = 0; index < nodes.length - 2; index += 1) {
    const node = nodes[index];
    if (!node || node.nodeType !== "word") {
      continue;
    }

    const node2 = nodes[index + 1];
    if (
      !node2 ||
      node2.nodeType !== "separator" ||
      node2.separatorType !== "dash"
    ) {
      continue;
    }

    const node3 = nodes[index + 2];
    if (
      !node3 ||
      node3.nodeType !== "word" ||
      node3.wordType !== "unclassified" ||
      node3.value.match(/\d/)
    ) {
      continue;
    }

    nodes.splice(index, 3, {
      nodeType: "word",
      wordType: "unclassified",
      value: `${node.value}-${node3.value}`,
    });
  }

  return nodes;
};
