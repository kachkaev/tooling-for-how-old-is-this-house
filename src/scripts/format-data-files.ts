import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import path from "path";

import { cleanEnv } from "../shared/cleanEnv";
import { formatJson, getJsonFormattingStyle } from "../shared/helpersForJson";
import { processFiles } from "../shared/processFiles";
import { getTerritoryDirPath } from "../shared/territory";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("Formatting all data files\n"));

  const { CUSTOM_PATH: customPath } = cleanEnv({
    CUSTOM_PATH: envalid.str({ default: "" }),
  });

  await processFiles({
    fileSearchPattern: "**/*.(json|geojson)",
    fileSearchDirPath: customPath
      ? path.resolve(getTerritoryDirPath(), customPath)
      : getTerritoryDirPath(),
    filesNicknameToLog: "files to format",
    output,
    statusReportFrequency: 500,
    processFile: async (filePath) => {
      const originalJson = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(originalJson);
      const formattedJson = formatJson(jsonData, {
        checkIntegrity: true,
        formattingStyle: getJsonFormattingStyle(filePath),
      });
      if (originalJson !== formattedJson) {
        await fs.writeFile(filePath, formattedJson, "utf8");
      }
    },
  });
};

await script();
