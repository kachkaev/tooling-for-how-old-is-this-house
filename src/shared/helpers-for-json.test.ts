import { serializeTime } from "./helpers-for-json";

describe("serializeTime", () => {
  it("parses RFC2822", () => {
    expect(serializeTime("Fri, 26 Feb 2021 08:20:27 GMT")).toBe(
      "2021-02-26T08:20:27Z",
    );
  });

  it("parses ISO", () => {
    expect(serializeTime("2021-02-26T08:20:27Z")).toBe("2021-02-26T08:20:27Z");

    expect(serializeTime("2021-02-26T08:20:27.420Z")).toBe(
      "2021-02-26T08:20:27Z",
    );
  });

  it("works without an argument", () => {
    expect(serializeTime()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
