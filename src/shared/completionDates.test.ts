import { deriveCompletionYearFromCompletionDates } from "./completionDates";

describe("deriveCompletionYearFromCompletionDates", () => {
  it.each`
    input                                  | expectedResult
    ${"1999"}                              | ${1999}
    ${"примерно 1999 "}                    | ${1999}
    ${"1999-2000"}                         | ${2000}
    ${"1999 - 2000"}                       | ${1999}
    ${"19 век (1900)"}                     | ${1900}
    ${"19 век (1900-1960)"}                | ${1960}
    ${"50-60 года XIX века"}               | ${undefined}
    ${"2-я пол.18 в., 1859-1867 гг."}      | ${1867}
    ${"7 апреля 1917 г., 1918 - 1919 гг."} | ${1917}
  `(`returns $expectedResult for $input`, ({ input, expectedResult }) => {
    expect(deriveCompletionYearFromCompletionDates(input)).toEqual(
      expectedResult,
    );
  });
});
