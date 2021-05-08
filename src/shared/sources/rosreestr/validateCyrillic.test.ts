import { validateCyrillic } from "./validateCyrillic";

describe("checkIfIsReadableCyrillic", () => {
  it.each([
    [true, "41"],
    [false, "РўСЂ"],
    [false, "РўСЂР°РЅСЃС„РѕСЂРјР°С‚РѕСЂРЅР°СЏ РїРѕРґСЃС‚Р°РЅС†РёСЏ в„– 109"],
    [true, "улица Такая-то"],
    [true, "УЛИЦА ТЕСТОВАЯ 10"],
    [true, 'ГСК "Заря-1"'],
    [true, ""],
  ])("returns %p for %p", (expectedResult, input) => {
    expect(validateCyrillic(input)).toEqual(expectedResult);
  });
});
