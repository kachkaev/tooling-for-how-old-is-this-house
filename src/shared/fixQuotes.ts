const isLetter = (char: string | undefined): boolean =>
  Boolean(char?.match(/\p{L}/u));

const isNumber = (char: string | undefined): boolean =>
  Boolean(char?.match(/\d/u));

const isNameSymbol = (char: string | undefined): boolean =>
  char === "+" || char === "!" || char === "?";

export const fixQuotes = (input: string): string => {
  let nesting = 0;
  let prevQuoteIndex = -1;

  const result = input
    .replace(/''/g, "'")
    .replace(
      /["'‘’“”„]/g,
      (match: string, charIndex: number, partiallyProcessedInput: string) => {
        const prevChar = partiallyProcessedInput[charIndex - 1];
        const nextChar = partiallyProcessedInput[charIndex + 1];

        const prevCharIsLetter = isLetter(prevChar);
        const prevCharIsNumber = isNumber(prevChar);
        const prevCharIsNameSymbol = isNameSymbol(prevChar);
        const prevCharIsQuote = prevQuoteIndex === charIndex - 1;

        const nextCharIsLetter = isLetter(nextChar);
        const nextCharIsNumber = isNumber(nextChar);

        let quoteType: "opening" | "closing" | undefined;

        if (!prevCharIsLetter && (nextCharIsLetter || nextCharIsNumber)) {
          quoteType = "opening";
        } else if (
          (prevCharIsQuote ||
            prevCharIsNumber ||
            prevCharIsLetter ||
            prevCharIsNameSymbol) &&
          !nextCharIsLetter
        ) {
          quoteType = "closing";
        }

        if (!quoteType) {
          return match;
        }

        if (quoteType === "opening") {
          nesting += 1;
          prevQuoteIndex = charIndex;

          return nesting % 2 ? "«" : "„";
        } else {
          nesting -= 1;
          prevQuoteIndex = charIndex;

          return nesting % 2 ? "“" : "»";
        }
      },
    );

  if (nesting > 0) {
    return `${result}»`;
  }

  return result;
};
