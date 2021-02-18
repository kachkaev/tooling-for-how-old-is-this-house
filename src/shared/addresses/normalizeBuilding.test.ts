import { normalizeBuilding } from "./normalizeBuilding";

const testCases = [
  {
    inputs: ["1", "   1/20"],
    output: "1",
  },
  {
    inputs: ["42а", "42 а", "   42а/8", "   42а / 8в"],
    output: "42а",
  },
];

describe("normalizeBuilding()", () => {
  for (const { inputs, output } of testCases) {
    for (const input of inputs) {
      it(`works for "${input}" → "${output}"`, () => {
        expect(normalizeBuilding(input)).toEqual(output);
      });
    }
  }
});
