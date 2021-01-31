import fs from "fs-extra";
import _ from "lodash";
import path from "path";

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
    [
      {
        "key1": "value1",
        "key2": "value2",
      }
    ]
    
    == after ==
    [{
      "key1": "value1",
      "key2": "value2",
    }]
   */
  if (result.startsWith("[") && result.endsWith("]")) {
    result = result
      .replace(/\n\t/g, "\n")
      .replace("[\n{", "[{")
      .replace("}\n]", "}]");
  }

  /*
    == before ==
    ...
    {
      "key1": "value1",
      "key2": "value2",
    },
    {
      "key1": "value1",
      "key2": "value2",
    }
    ...
    
    == after ==
    ...
    {
      "key1": "value1",
      "key2": "value2",
    }, {
      "key1": "value1",
      "key2": "value2",
    }
    ...
   */
  for (let whitespace = ""; whitespace.length <= 10; whitespace += "\t") {
    result = result.replace(
      new RegExp(`\\n${whitespace}\\},\\n${whitespace}\\{`, "g"),
      "\n}, {",
    );
  }

  if (result.startsWith("[") && result.endsWith("]\n")) {
    result = result
      .replace(/\n\t/g, "\n")
      .replace("[\n{", "[{")
      .replace("}\n]", "}]")
      .replace(/\},\n\{/g, "}, {");
  }

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
    "something": {
      "key", value
    }
    
    == after ==
    "something": { "key": value }
   */
  result = result.replace(/\n(\t+".*": ){\n\t+(.*)\n\t+}/g, "\n$1{ $2 }");

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
  await fs.mkdirp(path.dirname(filePath));
  await fs.writeFile(filePath, formatJson(object, options), "utf8");
};
