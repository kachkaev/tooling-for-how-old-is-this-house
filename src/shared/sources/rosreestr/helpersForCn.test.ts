import { isValidObjectCn } from "./helpersForCn";

describe("isValidObjectCn", () => {
  it.each`
    input                  | expectedResult
    ${"45:20:000000:2309"} | ${true}
    ${"58:29:3002004:63"}  | ${true}
    ${"58:29:3002004"}     | ${false}
    ${"58:29:30020040:63"} | ${false}
    ${"0:0:0:86"}          | ${true}
  `(`returns $expectedResult for $input`, ({ input, expectedResult }) => {
    expect(isValidObjectCn(input)).toEqual(expectedResult);
  });
});
