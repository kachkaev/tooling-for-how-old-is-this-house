/* eslint-disable no-console */
import defaultReporter from "envalid/src/reporter";

// https://github.com/af/envalid/issues/101
export const customEnvalidReporter = (opts) => {
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
