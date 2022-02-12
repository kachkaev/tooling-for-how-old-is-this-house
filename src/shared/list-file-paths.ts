import chalk from "chalk";
import { globby } from "globby";
import _ from "lodash";
import { WriteStream } from "node:tty";

export const listFilePaths = async ({
  fileSearchDirPath,
  fileSearchPattern,
  filesNicknameToLog,
  output,
}: {
  fileSearchDirPath: string;
  fileSearchPattern: string | string[];
  filesNicknameToLog?: string;
  output?: WriteStream | undefined;
}): Promise<string[]> => {
  output?.write(chalk.green(`Listing ${filesNicknameToLog ?? "files"}...`));

  const rawGlobbyResults = await globby(fileSearchPattern, {
    cwd: fileSearchDirPath,
    absolute: true,
    onlyFiles: true,
  });
  const globbyResults = _.sortBy(rawGlobbyResults);
  output?.write(` Found: ${globbyResults.length}.\n`);

  return globbyResults;
};
