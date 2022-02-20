import chalk from "chalk";
import fs from "fs-extra";

import { ScriptError } from "../../../shared/helpers-for-scripts";
import { getMkrfJsonsDumpFilePath } from "../../../shared/source-mkrf";

const output = process.stdout;

const script = async () => {
  output.write(
    chalk.bold("sources/mkrf: Checking the presence of the JSONS dump\n"),
  );

  const jsonsDumpFilePath = getMkrfJsonsDumpFilePath();

  output.write(`Location: ${chalk.cyan(jsonsDumpFilePath)}\n`);

  if (!(await fs.pathExists(jsonsDumpFilePath))) {
    throw new ScriptError(`File does not exist.`);
  }

  if (!jsonsDumpFilePath.endsWith(".jsons")) {
    throw new ScriptError(`Expected file extension extension to be ‘jsons’.`);
  }

  output.write("All good - file exists!\n");
};

await script();
