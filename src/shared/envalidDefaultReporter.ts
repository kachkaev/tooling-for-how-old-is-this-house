// Origin: https://github.com/af/envalid/blob/a694876d3fe5f8a8316d15ce4e26e895f41966f6/src/reporter.ts

import { EnvMissingError, ReporterOptions } from "envalid";

// Apply ANSI colors to the reporter output only if we detect that we're running in Node
const isNode = !!(typeof process === "object" && process?.versions?.node);
const colorWith = (colorCode: string) => (str: string) =>
  isNode ? `\x1b[${colorCode}m${str}\x1b[0m` : str;

const colors = {
  blue: colorWith("34"),
  white: colorWith("37"),
  yellow: colorWith("33"),
};

const rule = colors.white("================================");

export const defaultReporter = ({ errors = {} }: ReporterOptions<any>) => {
  if (!Object.keys(errors).length) {
    return;
  }

  const missingVarsOutput: string[] = [];
  const invalidVarsOutput: string[] = [];
  for (const [k, err] of Object.entries(errors)) {
    if (err instanceof EnvMissingError) {
      missingVarsOutput.push(
        `    ${colors.blue(k)}: ${err.message || "(required)"}`,
      );
    } else {
      invalidVarsOutput.push(
        `    ${colors.blue(k)}: ${err?.message || "(invalid format)"}`,
      );
    }
  }

  // Prepend "header" output for each section of the output:
  if (invalidVarsOutput.length) {
    invalidVarsOutput.unshift(
      ` ${colors.yellow("Invalid")} environment variables:`,
    );
  }
  if (missingVarsOutput.length) {
    missingVarsOutput.unshift(
      ` ${colors.yellow("Missing")} environment variables:`,
    );
  }

  const output = [
    rule,
    invalidVarsOutput.sort().join("\n"),
    missingVarsOutput.sort().join("\n"),
    colors.yellow("\n Exiting with error code 1"),
    rule,
  ]
    .filter((x) => !!x)
    .join("\n");

  // eslint-disable-next-line no-console
  console.error(output);

  if (isNode) {
    process.exit(1);
  } else {
    throw new TypeError("Environment validation failed");
  }
};
