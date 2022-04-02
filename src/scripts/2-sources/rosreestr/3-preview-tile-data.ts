import chalk from "chalk";

import { combineRosreestrTilesAndSavePreviews } from "../../../shared/source-rosreestr";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("sources/rosreestr: Previewing tile data / CCOs\n"));
  await combineRosreestrTilesAndSavePreviews({ objectType: "cco", output });

  output.write(chalk.bold("sources/rosreestr: Previewing tile data / lots\n"));
  await combineRosreestrTilesAndSavePreviews({ objectType: "lot", output });
};

await script();
