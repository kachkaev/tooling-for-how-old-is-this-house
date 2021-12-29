import chalk from "chalk";
import _ from "lodash";
import { dynamicImport } from "tsimportlib";
import { WriteStream } from "tty";

export const listFilePaths = async ({
  fileSearchDirPath,
  fileSearchPattern,
  filesNicknameToLog,
  output,
}: {
  fileSearchDirPath: string;
  fileSearchPattern: string | string[];
  filesNicknameToLog?: string;
  output?: WriteStream;
}): Promise<string[]> => {
  output?.write(chalk.green(`Listing ${filesNicknameToLog}...`));

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
  output?.write(` Found: ${globbyResults.length}.\n`);

  return globbyResults;
};
