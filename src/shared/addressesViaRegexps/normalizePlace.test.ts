import { normalizePlace } from "./normalizePlace";

const testCases = [
  {
    inputs: ["г. Тестовск", "гор.   тестовск"],
    output: "тестовск",
  },
  {
    inputs: ["Тестов"],
    output: "тестов",
  },
];

describe("normalizePlace()", () => {
  for (const { inputs, output } of testCases) {
    for (const input of inputs) {
      it(`works for "${input}" → "${output}"`, () => {
        expect(normalizePlace(input)).toEqual(output);
      });
    }
  }
});
