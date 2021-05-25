import { validateCyrillic } from "./validateCyrillic";

describe("checkIfIsReadableCyrillic", () => {
  it.each`
    input                                                              | expectedResult
    ${"41"}                                                            | ${true}
    ${"РўСЂ"}                                                          | ${false}
    ${"РўСЂР°РЅСЃС„РѕСЂРјР°С‚РѕСЂРЅР°СЏ РїРѕРґСЃС‚Р°РЅС†РёСЏ в„– 109"} | ${false}
    ${"улица Такая-то"}                                                | ${true}
    ${"УЛИЦА ТЕСТОВАЯ 10"}                                             | ${true}
    ${'ГСК "Заря-1"'}                                                  | ${true}
    ${""}                                                              | ${true}
  `("returns $expectedResult for $input", ({ input, expectedResult }) => {
    expect(validateCyrillic(input)).toEqual(expectedResult);
  });
});
