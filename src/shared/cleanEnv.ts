import { config } from "dotenv-flow";
import * as envalid from "envalid";

import { defaultReporter } from "./envalidDefaultReporter";

// https://github.com/af/envalid/issues/101
export const customEnvalidReporter: typeof defaultReporter = (opts) => {
  /* eslint-disable no-console */
  const originalConsoleError = console.error;

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalProcessExit = process.exit;

  let errorOutput = "\n";
  console.error = (output: unknown) => {
    errorOutput += output;
  };
  process.exit = () => undefined as never;

  defaultReporter(opts);

  process.exit = originalProcessExit;
  console.error = originalConsoleError;
  /* eslint-enable no-console */

  if (errorOutput.length > 1) {
    throw new Error(errorOutput);
  }
};

export const cleanEnv = <T>(specs: {
  [K in keyof T]: envalid.ValidatorSpec<T[K]>;
}) => {
  config({ silent: true });

  return envalid.cleanEnv(process.env, specs, {
    reporter: customEnvalidReporter,
  });
};
