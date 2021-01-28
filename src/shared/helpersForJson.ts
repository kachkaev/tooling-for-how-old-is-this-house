import fs from "fs-extra";
import _ from "lodash";

export const getSerialisedNow = (): string => new Date().toUTCString();

interface FormatJsonOptions {
  checkIntegrity?: boolean;
}

const formatJson = (object: unknown, options?: FormatJsonOptions): string => {
  let result = JSON.stringify(object, null, "\t");

  // Below transformations makes sense at scale for multiline
  // JSON files with tends of thousands of lines

  /*
    == before ==
    "something": [
      x,
      y
    ]
    
    == after ==
    "something": [x, y]
   */
  result = result.replace(
    /": \[\n\t+(-?\d+\.?\d*),\n\t+(-?\d+\.?\d*)\n\t+\]/g,
    '": [$1, $2]',
  );

  /*
    == before ==
    "something": [
      x,
      y,
      z
    ]
    
    == after ==
    "something": [x, y, z]
   */
  result = result.replace(
    /": \[\n\t+(-?\d+\.?\d*),\n\t+(-?\d+\.?\d*),\n\t+(-?\d+\.?\d*)\n\t+\]/g,
    '": [$1, $2, $3]',
  );

  /*
    == before ==
    [
      lon,
      lat
    ]
    
    == after ==
    [lon, lat]
   */
  result = result.replace(
    /(\n\t+)\[\n\t+(-?\d+\.?\d*),\n\t+(-?\d+\.?\d*)\n\t+\]/g,
    "$1[$2, $3]",
  );

  /*
    == before ==
    "coordinates": [
      [
        [lon, lat],
        ...
        [lon, lat]
      ]
    ]
    
    == after ==
    "coordinates": [[
      [lon, lat],
      ...
      [lon, lat]
    ]]
   */
  for (let whitespace = ""; whitespace.length <= 10; whitespace += "\t") {
    result = result.replace(
      new RegExp(
        `\\[\\n${whitespace}\t\\[(\\n(${whitespace}\t[^\\n]+\\n)+)${whitespace}\t\\]\\n\t+\\]`,
        "g",
      ),
      (match, p1) => `[[${p1.replace(/\n\t/g, "\n")}${whitespace}]]`,
    );
  }

  if (options?.checkIntegrity) {
    if (!_.isEqual(object, JSON.parse(result))) {
      throw new Error(`Integrity check failed`);
    }
  }

  return result;
};

export const writeFormattedJson = async (
  filePath: string,
  object: unknown,
  options?: FormatJsonOptions,
) => {
  await fs.writeFile(filePath, formatJson(object, options), "utf8");
};
