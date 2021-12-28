import chalk from "chalk";

import { generateProgress } from "./helpersForScripts";
import { listFilePaths } from "./listFilePaths";

export const processFiles = async ({
  logger,
  fileSearchPattern,
  fileSearchDirPath,
  filesNicknameToLog = "files",
  processFile,
  statusReportFrequency = 1,
}: {
  logger?: Console;
  fileSearchPattern: string | string[];
  fileSearchDirPath: string;
  filesNicknameToLog?: string;
  processFile: (
    filePath: string,
    prefixLength: number,
    reportingStatus: boolean,
  ) => void | Promise<void>;
  statusReportFrequency?: number;
}) => {
  const filePaths = await listFilePaths({
    filesNicknameToLog,
    fileSearchPattern,
    fileSearchDirPath,
    logger,
  });

  const numberOfFiles = filePaths.length;

  if (logger) {
    process.stdout.write(chalk.green(`Processing ${filesNicknameToLog}...`));
    if (statusReportFrequency) {
      process.stdout.write("\n");
    }
  }

  for (let index = 0; index < numberOfFiles; index += 1) {
    const filePath = filePaths[index]!;
    const progress = generateProgress(index, numberOfFiles);

    const reportingStatus =
      statusReportFrequency !== 0 &&
      (statusReportFrequency === 1 || index !== 0) &&
      ((index + 1) % statusReportFrequency === 0 ||
        index === numberOfFiles - 1);

    if (reportingStatus) {
      logger?.log(`${progress} ${chalk.green(filePath)}`);
    }

    try {
      await processFile(filePath, progress.length, reportingStatus);
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
