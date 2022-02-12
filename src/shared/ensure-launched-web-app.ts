import axios from "axios";
import chalk from "chalk";
import getPort from "get-port";
import _ from "lodash";
import next from "next";
import { createServer } from "node:http";
import { WriteStream } from "node:tty";
import { parse } from "node:url"; // https://github.com/vercel/next.js/discussions/21283

import { ScriptError } from "./helpers-for-scripts";
import { getTerritoryConfig, TerritoryConfig } from "./territory";

const defaultPort = 3000;

const generateAppUrl = (port: number) => `http://localhost:${port}`;

const checkIfWebAppIsLaunched = async (
  webAppUrl: string,
  territoryConfig: TerritoryConfig,
): Promise<boolean> => {
  try {
    const { data: fetchedTerritoryConfig } = await axios.get<TerritoryConfig>(
      `${webAppUrl}/api/territory-config`,
      {
        responseType: "json",
      },
    );

    return _.isEqual(fetchedTerritoryConfig, territoryConfig);
  } catch {
    return false;
  }
};

export const ensureLaunchedWebApp = async ({
  action,
  output,
}: {
  action: (webAppUrl: string) => Promise<void>;
  output: WriteStream;
}) => {
  const existingWebAppUrl = generateAppUrl(defaultPort);
  const territoryConfig = await getTerritoryConfig();

  if (await checkIfWebAppIsLaunched(existingWebAppUrl, territoryConfig)) {
    await action(existingWebAppUrl);

    return;
  }

  const tempAppPort = await getPort();
  const tempWebAppUrl = generateAppUrl(tempAppPort);

  output.write(
    chalk.green(`Starting a temporary web app at ${tempWebAppUrl}...`),
  );

  // https://github.com/vercel/next.js/issues/4808
  // https://github.com/vercel/next.js/pull/22587
  const originalConsole = global.console;
  global.console = { ...originalConsole, log: () => {}, warn: () => {} };

  const app = next({ dev: true, quiet: true });
  await app.prepare();
  const handle = app.getRequestHandler();
  const server = createServer((req, res) => {
    void handle(req, res, parse(req.url ?? "", true));
  });
  server.listen(tempAppPort);

  output.write(" Done.\n");

  output.write(
    chalk.blue(
      'The above step is skipped if you run "yarn dev" in another terminal. Doing so can slightly speed up the script.\n',
    ),
  );

  if (!(await checkIfWebAppIsLaunched(tempWebAppUrl, territoryConfig))) {
    throw new ScriptError(
      `Unable to validate the web app at ${tempWebAppUrl}. Please report a bug.`,
    );
  }

  try {
    await action(tempWebAppUrl);
  } finally {
    output.write(chalk.green(`Stopping the web app at ${tempWebAppUrl}...`));
    server.close();
    await app.close();
    global.console = originalConsole;
    output.write(" Done.\n");
  }
};
