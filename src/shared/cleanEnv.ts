/* eslint-disable no-console */
import { config as dotenvConfig } from "dotenv";
import * as envalid from "envalid";

import { defaultReporter } from "./envalidDefaultReporter";

// https://github.com/af/envalid/issues/101
export const customEnvalidReporter: typeof defaultReporter = (opts) => {
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;

  let errorOutput = "\n";
  console.error = (output) => {
    errorOutput += output;
  };
  process.exit = () => undefined as never;

  defaultReporter(opts);

  process.exit = originalProcessExit;
  console.error = originalConsoleError;

  if (errorOutput.length > 1) {
    throw new Error(errorOutput);
  }
};

export const cleanEnv = <T>(
  specs: {
    [K in keyof T]: envalid.ValidatorSpec<T[K]>;
  },
) => {
  dotenvConfig();

  return envalid.cleanEnv(process.env, specs, {
    reporter: customEnvalidReporter,
  });
};
