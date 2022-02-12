import chalk from "chalk";
import { WriteStream } from "node:tty";

import { generateProgress } from "./helpers-for-scripts";
import { listFilePaths } from "./list-file-paths";

export const processFiles = async ({
  fileSearchPattern,
  fileSearchDirPath,
  filesNicknameToLog = "files",
  output,
  processFile,
  statusReportFrequency = 1,
}: {
  fileSearchPattern: string | string[];
  fileSearchDirPath: string;
  filesNicknameToLog?: string;
  output?: WriteStream | undefined;
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
    output,
  });

  const numberOfFiles = filePaths.length;

  output?.write(chalk.green(`Processing ${filesNicknameToLog}...`));
  if (statusReportFrequency) {
    output?.write("\n");
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
      output?.write(`${progress} ${chalk.green(filePath)}\n`);
    }

    try {
      await processFile(filePath, progress.length, reportingStatus);
    } catch (error) {
      output?.write(
        chalk.red(`Unexpected error while processing file ${filePath}`),
      );
      throw error;
    }
  }

  if (!statusReportFrequency) {
    output?.write(" Done.\n");
  }
};
