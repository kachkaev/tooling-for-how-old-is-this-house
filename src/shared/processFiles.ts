import chalk from "chalk";
import globby from "globby";
import _ from "lodash";

import { generateProgress } from "./helpersForCommands";

export const processFiles = async ({
  logger,
  fileSearchPattern,
  fileSearchDirPath,
  filesNicknameToLog = "files",
  processFile,
  showFilePath = false,
  statusReportFrequency = 1,
}: {
  logger?: Console;
  fileSearchPattern: string | string[];
  fileSearchDirPath: string;
  filesNicknameToLog?: string;
  processFile: (filePath: string, prefixLength: number) => void | Promise<void>;
  showFilePath?: boolean;
  statusReportFrequency?: number;
}) => {
  if (logger) {
    process.stdout.write(chalk.green(`Listing ${filesNicknameToLog}...`));
  }
  const rawGlobbyResults = await globby(fileSearchPattern, {
    cwd: fileSearchDirPath,
    absolute: true,
    onlyFiles: true,
  });
  const globbyResults = _.sortBy(rawGlobbyResults);

  // const numberOfFiles = Math.min(globbyResults.length, 60);
  const numberOfFiles = globbyResults.length;

  if (logger) {
    process.stdout.write(` Found: ${numberOfFiles}.\n`);
    process.stdout.write(chalk.green(`Processing ${filesNicknameToLog}...`));
    if (statusReportFrequency) {
      process.stdout.write("\n");
    }
  }

  for (let index = 0; index < numberOfFiles; index += 1) {
    const filePath = globbyResults[index]!;
    const progress = generateProgress(index, numberOfFiles);

    if (
      statusReportFrequency !== 0 &&
      (statusReportFrequency === 1 || index !== 0) &&
      ((index + 1) % statusReportFrequency === 0 || index === numberOfFiles - 1)
    ) {
      logger?.log(
        `${progress}${showFilePath ? ` ${chalk.green(filePath)}` : ""}`,
      );
    }

    try {
      await processFile(filePath, progress.length);
    } catch (e) {
      logger?.error(
        chalk.red(`Unexpected error while processing file ${filePath}`),
      );
      throw e;
    }
  }

  if (logger && !statusReportFrequency) {
    process.stdout.write(" Done.\n");
  }
};
