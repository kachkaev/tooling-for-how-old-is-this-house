import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export const getSerialisedNow = (): string => new Date().toUTCString();

/**
 * The ability to pick formatting style is needed for backwards-compatibility.
 * Data files generated before breaking changes can remain untouched,
 * thus saving git history from bloating.
 */
export type FormattingStyle = "deprecated-on-2020-02-05" | "modern";

export const getJsonFormattingStyle = (filePath: string): FormattingStyle => {
  if (
    filePath.match(/\/penza\/sources\/migkh\/house-lists?/) ||
    filePath.match(/\/penza\/sources\/rosreestr\/.*\/by-tiles\//) ||
    filePath.match(/\/penza\/sources\/wikimapia\/tiles\//)
  ) {
    return "deprecated-on-2020-02-05";
  }

  return "modern";
};

interface FormatJsonOptions {
  checkIntegrity?: boolean;
  formattingStyle?: FormattingStyle;
}

/**
 * Produces a multi-line JSON string with some added compactness.
 * This custom formatting makes sense at scale for large JSON files
 * stored in a git repo.
 */
export const formatJson = (
  object: unknown,
  options?: FormatJsonOptions,
): string => {
  const formattingStyle = options?.formattingStyle ?? "modern";
  let result = `${JSON.stringify(object, null, "\t")}\n`;

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
  if (formattingStyle === "deprecated-on-2020-02-05") {
    if (result.startsWith("[") && result.endsWith("]\n")) {
      result = result
        .replace(/\n\t/g, "\n")
        .replace("[\n{", "[{")
        .replace("}\n]", "}]");
    }
  } else {
    for (let whitespace = ""; whitespace.length <= 10; whitespace += "\t") {
      try {
        result = result.replace(
          new RegExp(
            `\\[\\n${whitespace}\t\\{(\\n(${whitespace}[\\}\\{\\t][^\\n]+\\n)+)${whitespace}\t\\}\\n\t*\\]`,
            "g",
          ),
          (match, p1) => `[{${p1.replace(/\n\t/g, "\n")}${whitespace}}]`,
        );
      } catch (e) {
        // The following error has been noticed in a GeoJSON with ≈ 1M rows:
        //
        //    "RangeError: Maximum call stack size exceeded"
        //
        // Wrapping string.replace into try/catch prevents a crash if resource limit is reached.
      }
    }
  }

  /*
    == before ==
    ...
    {
      "key1": "value1",
      "key2": "value2"
    },
    {
      "key1": "value1",
      "key2": "value2"
    }
    ...

    == after ==
    ...
    {
      "key1": "value1",
      "key2": "value2"
    }, {
      "key1": "value1",
      "key2": "value2"
    }
    ...
   */
  for (let whitespace = ""; whitespace.length <= 10; whitespace += "\t") {
    result = result.replace(
      new RegExp(`\\n${whitespace}\\},\\n${whitespace}\\{`, "g"),
      `\n${whitespace}}, {`,
    );
  }

  /*
    == before ==
    [
      x,
      y
    ]
    
    == after ==
    [x, y]
   */
  result = result.replace(
    /\[\n\t+(-?\d+\.?\d*),\n\t+(-?\d+\.?\d*)\n\t+\]/g,
    "[$1, $2]",
  );

  /*
    == before ==
    [
      x,
      y,
      z
    ]
    
    == after ==
    [x, y, z]
   */
  result = result.replace(
    /\[\n\t+(-?\d+\.?\d*),\n\t+(-?\d+\.?\d*),\n\t+(-?\d+\.?\d*)\n\t+\]/g,
    "[$1, $2, $3]",
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
  const formattingStyle =
    options?.formattingStyle ?? getJsonFormattingStyle(filePath);

  const processedOptions = {
    ...(options ?? {}),
    formattingStyle,
  };

  await fs.mkdirp(path.dirname(filePath));
  await fs.writeFile(filePath, formatJson(object, processedOptions), "utf8");
};
