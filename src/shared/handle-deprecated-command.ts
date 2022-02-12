import _ from "lodash";
import path from "node:path";

/**
 * TODO: Remove after 2022-04-01
 */
export const handleDeprecatedCommand = async (importMeta: ImportMeta) => {
  const filePath = new URL(importMeta.url).pathname;
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath, ".ts");
  const newFileName = _.kebabCase(fileName);
  const newFilePath = path.resolve(
    dirPath.replace(/\\/g, "/").replace("src/commands", "src/scripts"),
    `${newFileName}.ts`,
  );

  /* eslint-disable no-console */
  console.log();
  console.log("========");
  console.log(`Script paths have changed. Please replace`);
  console.log(`  ${path.relative(process.cwd(), filePath)}`);
  console.log("with");
  console.log(`  ${path.relative(process.cwd(), newFilePath)}`);
  console.log("to hide this warning. Old paths will stop working in the");
  console.log("future, so should be removed from all software and docs.");
  console.log("========");
  console.log();
  /* eslint-enable no-console */

  await import(newFilePath);
};
