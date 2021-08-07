import { parseCompletionTime } from "./parseCompletionTime";

describe("parseCompletionTime", () => {
  it.each`
    input                                        | derivedCompletionTimeForGeosemantica                         | derivedCompletionYear | derivedCompletionYearRange
    ${undefined}                                 | ${undefined}                                                 | ${undefined}          | ${undefined}
    ${"1999"}                                    | ${"1999"}                                                    | ${1999}               | ${[1999, 1999]}
    ${"1999 г"}                                  | ${"1999"}                                                    | ${1999}               | ${[1999, 1999]}
    ${"1999 г."}                                 | ${"1999"}                                                    | ${1999}               | ${[1999, 1999]}
    ${"1999 год"}                                | ${"1999"}                                                    | ${1999}               | ${[1999, 1999]}
    ${"1965-м"}                                  | ${"1965"}                                                    | ${1965}               | ${[1965, 1965]}
    ${"в 1965-ом"}                               | ${"1965"}                                                    | ${1965}               | ${[1965, 1965]}
    ${"    около 1999 "}                         | ${"около 1999"}                                              | ${1999}               | ${[1994, 2004]}
    ${"примерно 1999 "}                          | ${"около 1999"}                                              | ${1999}               | ${[1994, 2004]}
    ${"1999-2000"}                               | ${"1999-2000"}                                               | ${2000}               | ${[1999, 2000]}
    ${"1999-2000 гг"}                            | ${"1999-2000"}                                               | ${2000}               | ${[1999, 2000]}
    ${"1999-2000 гг."}                           | ${"1999-2000"}                                               | ${2000}               | ${[1999, 2000]}
    ${"1999-2000 г."}                            | ${"1999-2000"}                                               | ${2000}               | ${[1999, 2000]}
    ${"1839-1840-е гг."}                         | ${"1839-1840"}                                               | ${1840}               | ${[1839, 1840]}
    ${"1990-е"}                                  | ${"1990-е (применяется 1995)"}                               | ${1995}               | ${[1990, 1999]}
    ${"1790-е гг."}                              | ${"1790-е (применяется 1795)"}                               | ${1795}               | ${[1790, 1799]}
    ${"1976-7"}                                  | ${"1976-1977"}                                               | ${1977}               | ${[1976, 1977]}
    ${"ДО  2000"}                                | ${"до 2000"}                                                 | ${2000}               | ${[-Number.MAX_SAFE_INTEGER, 2000]}
    ${"1970   - 80"}                             | ${"1970-1980"}                                               | ${1980}               | ${[1970, 1980]}
    ${"1999   - 2000"}                           | ${"1999-2000"}                                               | ${2000}               | ${[1999, 2000]}
    ${"19 в. (1800)"}                            | ${"1800"}                                                    | ${1800}               | ${[1800, 1800]}
    ${"19 век (1800-1860)"}                      | ${"1800-1860"}                                               | ${1860}               | ${[1800, 1860]}
    ${"2 пол. ХIХ в."}                           | ${"2-я половина 19 века (применяется 1875)"}                 | ${1875}               | ${[1850, 1899]}
    ${"50 годы XIX века"}                        | ${"1850-е (применяется 1855)"}                               | ${1855}               | ${[1850, 1859]}
    ${"50-е годы XIX века"}                      | ${"1850-е (применяется 1855)"}                               | ${1855}               | ${[1850, 1859]}
    ${"50 года XIX века"}                        | ${"1850-е (применяется 1855)"}                               | ${1855}               | ${[1850, 1859]}
    ${"50-60 года XIX века"}                     | ${"1850-1860"}                                               | ${1860}               | ${[1850, 1860]}
    ${"XIX"}                                     | ${"19 век (применяется 1850)"}                               | ${1850}               | ${[1800, 1899]}
    ${"XIX в"}                                   | ${"19 век (применяется 1850)"}                               | ${1850}               | ${[1800, 1899]}
    ${"XIX в."}                                  | ${"19 век (применяется 1850)"}                               | ${1850}               | ${[1800, 1899]}
    ${"XIX век"}                                 | ${"19 век (применяется 1850)"}                               | ${1850}               | ${[1800, 1899]}
    ${"начало XIX века"}                         | ${"начало 19 века (применяется 1810)"}                       | ${1810}               | ${[1800, 1830]}
    ${"начало ХIХ века" /* Russian ‘х’ */}       | ${"начало 19 века (применяется 1810)"}                       | ${1810}               | ${[1800, 1830]}
    ${"конец 1920 - начало 1930-х"}              | ${"около 1930"}                                              | ${1930}               | ${[1925, 1935]}
    ${"конец 1920 - начало 1930 - х гг."}        | ${"около 1930"}                                              | ${1930}               | ${[1925, 1935]}
    ${"конец 1920-х"}                            | ${"около 1928"}                                              | ${1928}               | ${[1923, 1933]}
    ${"середина 1920 - х"}                       | ${"около 1925"}                                              | ${1925}               | ${[1920, 1930]}
    ${"начало  1920-х"}                          | ${"около 1922"}                                              | ${1922}               | ${[1917, 1927]}
    ${"конец XIX - начало XX вв."}               | ${"конец 19 века - начало 20 века (применяется 1890)"}       | ${1890}               | ${[1870, 1899]}
    ${"конец XIX — начало XX вв." /* em dash */} | ${"конец 19 века - начало 20 века (применяется 1890)"}       | ${1890}               | ${[1870, 1899]}
    ${"конец XIX – начало XX вв." /* en dash */} | ${"конец 19 века - начало 20 века (применяется 1890)"}       | ${1890}               | ${[1870, 1899]}
    ${"конец XIX − начало XX вв." /* minus */}   | ${"конец 19 века - начало 20 века (применяется 1890)"}       | ${1890}               | ${[1870, 1899]}
    ${"втор пол.18 в., 1859-1867 гг."}           | ${"2-я половина 18 века (применяется 1775), 1859-1867"}      | ${1775}               | ${[1750, 1799]}
    ${"2 пол. ХIХ в."}                           | ${"2-я половина 19 века (применяется 1875)"}                 | ${1875}               | ${[1850, 1899]}
    ${"к. XIX в.-н. XX в."}                      | ${"конец 19 века - начало 20 века (применяется 1890)"}       | ${1890}               | ${[1870, 1899]}
    ${"7 апреля 1917 г., 1918 - 1919 гг."}       | ${"1917, 1918-1919"}                                         | ${1917}               | ${[1917, 1917]}
    ${"Первая треть XIX века"}                   | ${"1-я треть 19 века (применяется 1820)"}                    | ${1820}               | ${[1800, 1835]}
    ${"Первая половина XIX века"}                | ${"1-я половина 19 века (применяется 1825)"}                 | ${1825}               | ${[1800, 1850]}
    ${"нач.XX в."}                               | ${"начало 20 века (применяется 1910)"}                       | ${1910}               | ${[1900, 1930]}
    ${"кон. XIX — II-я пол. XX в."}              | ${"конец 19 века - 2-я половина 20 века (применяется 1890)"} | ${1890}               | ${[1870, 1899]}
    ${"1791 г., XIX в., начало ХХ в."}           | ${"1791, 19 век, начало 20 века"}                            | ${1791}               | ${[1791, 1791]}
    ${"2021-08-05"}                              | ${"2021"}                                                    | ${2021}               | ${[2021, 2021]}
    ${"2021-08-05, 2022-08-05"}                  | ${"2021, 2022"}                                              | ${2021}               | ${[2021, 2021]}
    ${"05.08.2021"}                              | ${"2021"}                                                    | ${2021}               | ${[2021, 2021]}
    ${"05.08.2021...05.08.2022"}                 | ${"2021"}                                                    | ${2021}               | ${[2021, 2021]}
    ${"сер. XIX в., 1870-е гг., 1882-1895 гг"}   | ${"середина 19 века (применяется 1850), 1870-е, 1882-1895"}  | ${1850}               | ${[1830, 1870]}
    ${"1 пол. XIX в., 1880-е гг."}               | ${"1-я половина 19 века (применяется 1825), 1880-е"}         | ${1825}               | ${[1800, 1850]}
    ${"что-то пошло НЕ ТАК"}                     | ${"что-то пошло не так"}                                     | ${undefined}          | ${undefined}
  `(
    `returns "$derivedCompletionTimeForGeosemantica" / $derivedCompletionYear / $derivedCompletionYearRange for "$input"`,
    ({
      input,
      derivedCompletionTimeForGeosemantica,
      derivedCompletionYear,
      derivedCompletionYearRange,
    }) => {
      expect(parseCompletionTime(input)).toEqual({
        derivedCompletionTimeForGeosemantica,
        derivedCompletionYear,
        derivedCompletionYearRange,
      });
    },
  );
});
