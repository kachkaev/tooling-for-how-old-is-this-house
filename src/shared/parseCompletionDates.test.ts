import { parseCompletionDates } from "./parseCompletionDates";

describe("parseCompletionDates", () => {
  it.each`
    input                                  | derivedCompletionDatesForGeosemantica | derivedCompletionYear
    ${undefined}                           | ${undefined}                          | ${undefined}
    ${"1999"}                              | ${"1999"}                             | ${1999}
    ${"примерно 1999 "}                    | ${"примерно 1999"}                    | ${1999}
    ${"1999-2000"}                         | ${"1999-2000"}                        | ${2000}
    ${"1990-е"}                            | ${"около 1995 (1990-е)"}              | ${1995}
    ${"1999   - 2000"}                     | ${"1999-2000"}                        | ${2000}
    ${"19 век (1800)"}                     | ${"19 век (1800)"}                    | ${1800}
    ${"19 век (1800-1860)"}                | ${"19 век (1800-1860)"}               | ${1860}
    ${"50-60 года XIX века"}               | ${"50-60 года XIX века"}              | ${undefined}
    ${"2-я пол.18 в., 1859-1867 гг."}      | ${"2-я пол.18 в., 1859-1867 гг."}     | ${1867}
    ${"7 апреля 1917 г., 1918 - 1919 гг."} | ${"7 апреля 1917 г., 1918-1919 гг."}  | ${1917}
  `(
    `returns "$derivedCompletionDatesForGeosemantica" / $derivedCompletionYear for "$input"`,
    ({
      input,
      derivedCompletionDatesForGeosemantica,
      derivedCompletionYear,
    }) => {
      expect(parseCompletionDates(input)).toEqual({
        derivedCompletionDatesForGeosemantica,
        derivedCompletionYear,
      });
    },
  );
});
