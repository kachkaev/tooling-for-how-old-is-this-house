import { CleanedAddressAst } from "./types";

export const printCleanedAddressAst = (
  cleanedAddressAst: CleanedAddressAst,
): string => {
  const chunks: string[] = [];

  const nodes = cleanedAddressAst.children;
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    const nextNode = nodes[index + 1];

    if (node.nodeType === "word") {
      chunks.push(node.value);
      if (nextNode?.nodeType === "word") {
        chunks.push(" ");
      }
      continue;
    }

    if (node.separatorType === "comma") {
      chunks.push(", ");
    } else if (node.separatorType === "slash") {
      chunks.push("/");
    } else if (node.separatorType === "dash") {
      chunks.push("-");
    } else {
      throw new Error(`Unprintable separator type ${node.separatorType}`);
    }
  }

  return chunks.join("").toUpperCase();
};
