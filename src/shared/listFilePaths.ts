import chalk from "chalk";
import globby from "globby";
import _ from "lodash";

export const listFilePaths = async ({
  fileSearchDirPath,
  fileSearchPattern,
  filesNicknameToLog,
  logger,
}: {
  fileSearchDirPath: string;
  fileSearchPattern: string | string[];
  filesNicknameToLog?: string;
  logger?: Console;
}): Promise<string[]> => {
  if (logger) {
    process.stdout.write(chalk.green(`Listing ${filesNicknameToLog}...`));
  }
  const rawGlobbyResults = await globby(fileSearchPattern, {
    cwd: fileSearchDirPath,
    absolute: true,
    onlyFiles: true,
  });
  const globbyResults = _.sortBy(rawGlobbyResults);
  process.stdout.write(` Found: ${globbyResults.length}.\n`);

  return globbyResults;
};
