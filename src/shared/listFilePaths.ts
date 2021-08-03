import chalk from "chalk";
import _ from "lodash";
import { dynamicImport } from "tsimportlib";

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

  const { globby } = (await dynamicImport(
    "globby",
    module,
  )) as typeof import("globby");

  const rawGlobbyResults = await globby(fileSearchPattern, {
    cwd: fileSearchDirPath,
    absolute: true,
    onlyFiles: true,
  });
  const globbyResults = _.sortBy(rawGlobbyResults);
  if (logger) {
    process.stdout.write(` Found: ${globbyResults.length}.\n`);
  }

  return globbyResults;
};
