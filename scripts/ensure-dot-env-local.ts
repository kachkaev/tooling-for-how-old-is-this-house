import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";

const script = async () => {
  const output = process.stdout;
  const filePath = path.resolve(".env.local");
  if (await fs.pathExists(filePath)) {
    output.write(`File already exists: ${chalk.gray(`${filePath}`)}\n`);

    return;
  }

  output.write(`Creating ${chalk.magenta(`${filePath}`)}...`);
  await fs.ensureFile(filePath);
  output.write(" Done.\n");
};

await script();
