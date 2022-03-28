// Origin: https://github.com/af/envalid/blob/a694876d3fe5f8a8316d15ce4e26e895f41966f6/src/reporter.ts

import { EnvMissingError, ReporterOptions } from "envalid";

import { ScriptError } from "./scripts";

// Apply ANSI colors to the reporter output only if we detect that we're running in Node
const isNode = !!(typeof process === "object" && process.versions.node);
const colorWith = (colorCode: string) => (str: string) =>
  isNode ? `\u001B[${colorCode}m${str}\u001B[0m` : str;

const colors = {
  blue: colorWith("34"),
  white: colorWith("37"),
  yellow: colorWith("33"),
};

const rule = colors.white("================================");

export const defaultReporter = ({ errors = {} }: ReporterOptions<any>) => {
  if (Object.keys(errors).length === 0) {
    return;
  }

  const missingVarsOutput: string[] = [];
  const invalidVarsOutput: string[] = [];
  for (const [key, error] of Object.entries(errors)) {
    if (error instanceof EnvMissingError) {
      missingVarsOutput.push(
        `    ${colors.blue(key)}: ${error.message || "(required)"}`,
      );
    } else {
      invalidVarsOutput.push(
        `    ${colors.blue(key)}: ${error?.message || "(invalid format)"}`,
      );
    }
  }

  // Prepend "header" output for each section of the output:
  if (invalidVarsOutput.length > 0) {
    invalidVarsOutput.unshift(
      ` ${colors.yellow("Invalid")} environment variables:`,
    );
  }
  if (missingVarsOutput.length > 0) {
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

  const error = isNode
    ? new ScriptError("")
    : new TypeError("Environment validation failed");

  throw error;
};
