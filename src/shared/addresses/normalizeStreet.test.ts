import { normalizeStreet } from "./normalizeStreet";

const testCases = [
  {
    inputs: ["ул. Тестовая", " Тестовая    ул.  ", "  улица Тестовая "],
    output: "улица тестовая",
  },
  {
    inputs: ["пер. б. Тестовый", "б. тестовый переулок", "тестовый пер. б."],
    output: "переулок тестовый большой",
  },
  {
    inputs: ["наб. м. Тестовая"],
    output: "набережная тестовая малая",
  },
];

describe("normalizeStreet()", () => {
  for (const { inputs, output } of testCases) {
    for (const input of inputs) {
      it(`works for "${input}" → "${output}"`, () => {
        expect(normalizeStreet(input)).toEqual(output);
      });
    }
  }
});
