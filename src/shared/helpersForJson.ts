import fs from "fs-extra";

export const getSerialisedNow = (): string => new Date().toUTCString();

const formatJson = (object: unknown): string => {
  let result = JSON.stringify(object, null, 2);

  // Below transformations makes sense at scale for multiline
  // JSON files with tends of thousands of lines

  /*
    == before ==
    "tile": [
      x,
      y,
      z
    ]
    
    == after ==
    "tile": [x, y, z]
   */
  result = result.replace(
    /"tile": \[\n +(\d+),\n +(\d+),\n +(\d+)\n +\]/g,
    '"tile": [$1, $2, $3]',
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
    /(\n +)\[\n +(-?\d+\.?\d*),\n +(-?\d+\.?\d*)\n +\]/g,
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
  for (let whitespace = ""; whitespace.length <= 20; whitespace += "  ") {
    result = result.replace(
      new RegExp(
        `\\[\\n${whitespace}  \\[\\n((${whitespace}    [^\\n]+\\n)+)${whitespace}  \\]\\n +\\]`,
        "g",
      ),
      (match, p1) =>
        `[[\n${p1.replace(/\n {2}/g, "\n").substr(2)}${whitespace}]]`,
    );
  }

  return result;
};

export const writeFormattedJson = async (filePath: string, object: unknown) => {
  await fs.writeFile(filePath, formatJson(object), "utf8");
};
