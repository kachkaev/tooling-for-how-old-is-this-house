import chalk from "chalk";
import globby from "globby";
import _ from "lodash";

import { generateProgress } from "./helpersForCommands";

export const processFiles = async ({
  logger,
  fileSearchPattern,
  fileSearchDirPath,
  processFile,
  showFilePath = false,
  statusReportFrequency = 500,
}: {
  logger: Console;
  fileSearchPattern: string;
  fileSearchDirPath: string;
  processFile: (filePath: string, prefixLength: number) => Promise<void>;
  showFilePath?: boolean;
  statusReportFrequency?: number;
}) => {
  process.stdout.write(chalk.green("Listing files..."));
  const rawGlobbyResults = await globby(fileSearchPattern, {
    cwd: fileSearchDirPath,
    absolute: true,
  });
  const globbyResults = _.sortBy(rawGlobbyResults);

  // const numberOfFiles = Math.min(globbyResults.length, 60);
  const numberOfFiles = globbyResults.length;

  process.stdout.write(` Files found: ${numberOfFiles}.\n`);
  process.stdout.write(chalk.green("Processing files...\n"));

  for (let index = 0; index < numberOfFiles; index += 1) {
    const filePath = globbyResults[index]!;
    const progress = generateProgress(index, numberOfFiles);

    if (
      (statusReportFrequency === 1 || index !== 0) &&
      ((index + 1) % statusReportFrequency === 0 || index === numberOfFiles - 1)
    ) {
      logger.log(`${progress}${showFilePath ? chalk.green(filePath) : ""}`);
    }

    await processFile(filePath, progress.length);
  }
};
