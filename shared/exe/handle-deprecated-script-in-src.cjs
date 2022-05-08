const path = require("node:path");

const scriptPath = (process.argv[1] ?? "").replace(/\\/g, "/");

if (scriptPath.includes("/src/")) {
  const newScriptPath = scriptPath.replace("/src/", "/");

  /* eslint-disable no-console */
  console.log();
  console.log("#############################################");
  console.log(`##        Script paths have changed        ##`);
  console.log("#############################################");
  console.log("");
  console.log(`To hide this warning, please replace`);
  console.log("");
  console.log(`yarn exe ${path.relative(process.cwd(), scriptPath)}`);
  console.log("");
  console.log("with");
  console.log("");
  console.log(`yarn exe ${path.relative(process.cwd(), newScriptPath)}`);
  console.log("");
  console.log("Old paths will stop working in the future, so");
  console.log("they should be removed from software and docs.");
  console.log("");
  console.log("#############################################");
  console.log("");
  /* eslint-enable no-console */

  process.argv[1] = newScriptPath;
}
