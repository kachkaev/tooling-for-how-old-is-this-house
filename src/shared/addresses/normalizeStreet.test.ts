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
  {
    inputs: ["тер. 10-ая Тестовая", "10я Тестовая территория"],
    output: "территория тестовая 10-я",
  },
  {
    inputs: ["просп. 1й тестировщиков", "1-ый проспект тестировщиков"],
    output: "проспект тестировщиков 1-й",
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
