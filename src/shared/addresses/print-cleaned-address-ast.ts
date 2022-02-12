import {
  AddressNodeWithWord,
  CleanedAddressAst,
  FinalizeWordSpelling,
} from "./types";

export const printCleanedAddressAst = (
  cleanedAddressAst: CleanedAddressAst,
  finalizeWordSpelling: FinalizeWordSpelling = (word) =>
    word.value.toUpperCase(),
): string => {
  const chunks: string[] = [];

  const nodes = cleanedAddressAst.children;
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    const nextNode = nodes[index + 1];

    if (node.nodeType === "word") {
      chunks.push(
        finalizeWordSpelling(
          node,
          nodes
            .slice(index - 1, index + 1)
            .filter(
              (currentNode): currentNode is AddressNodeWithWord =>
                currentNode.nodeType === "word",
            ),
        ),
      );
      if (nextNode?.nodeType === "word") {
        chunks.push(" ");
      }
      continue;
    }

    switch (node.separatorType) {
      case "comma":
        chunks.push(", ");
        break;
      case "slash":
        chunks.push("/");
        break;
      case "dash":
        chunks.push("-");
        break;
    }
  }

  return chunks.join("");
};
