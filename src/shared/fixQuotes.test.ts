import { fixQuotes } from "./fixQuotes";

describe("fixQuotes", () => {
  it.each<{ input: string; expectedResult: string }>([
    {
      input: 'Остановка "Школа № 42"',
      expectedResult: "Остановка «Школа № 42»",
    },
    {
      input: "Остановка ''Школа № 42''",
      expectedResult: "Остановка «Школа № 42»",
    },
    {
      input: "Остановка ‘Школа № 42‘",
      expectedResult: "Остановка «Школа № 42»",
    },
    {
      input: 'Остановка "Школа № 42',
      expectedResult: "Остановка «Школа № 42»",
    },
    {
      input: 'Кафе "Калач +"',
      expectedResult: "Кафе «Калач +»",
    },
    {
      input: "бар 'Доколе!",
      expectedResult: "бар «Доколе!»",
    },
    {
      input: '"Школа № 42" (остановка)',
      expectedResult: "«Школа № 42» (остановка)",
    },
    {
      input: "фирма “ЗАО 'Рога и копыта'\"",
      expectedResult: "фирма «ЗАО „Рога и копыта“»",
    },
    {
      input: "фирма “ЗАО 'Рога и копыта'",
      expectedResult: "фирма «ЗАО „Рога и копыта“»",
    },
    {
      input: "фирмы 'Рога' и 'Копыта'",
      expectedResult: "фирмы «Рога» и «Копыта»",
    },
    { input: "10'а'", expectedResult: "10«а»" },
  ])("returns $expectedResult for $input", ({ input, expectedResult }) => {
    expect(fixQuotes(input)).toEqual(expectedResult);
  });
});
