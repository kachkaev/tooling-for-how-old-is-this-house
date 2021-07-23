import { CommandError } from "@kachkaev/commands";
import axios from "axios";
import chalk from "chalk";
import getPort from "get-port";
import { createServer } from "http";
import _ from "lodash";
import next from "next";
import { parse } from "url"; // https://github.com/vercel/next.js/discussions/21283

import { getTerritoryConfig, TerritoryConfig } from "./territory";

const defaultPort = 3000;

const generateAppUrl = (port: number) => `http://localhost:${port}`;

const checkIfWebAppIsLaunched = async (
  webAppUrl: string,
  territoryConfig: TerritoryConfig,
): Promise<boolean> => {
  try {
    const fetchedTerritoryConfig = (
      await axios.get(`${webAppUrl}/api/territory-config`, {
        responseType: "json",
      })
    ).data;

    return _.isEqual(fetchedTerritoryConfig, territoryConfig);
  } catch {
    return false;
  }
};

export const ensureLaunchedWebApp = async ({
  logger,
  action,
}: {
  logger: Console;
  action: (webAppUrl: string) => Promise<void>;
}) => {
  const existingWebAppUrl = generateAppUrl(defaultPort);
  const territoryConfig = await getTerritoryConfig();

  if (await checkIfWebAppIsLaunched(existingWebAppUrl, territoryConfig)) {
    await action(existingWebAppUrl);

    return;
  }

  const tempAppPort = await getPort();
  const tempWebAppUrl = generateAppUrl(tempAppPort);

  process.stdout.write(
    chalk.green(`Starting a temporary web app at ${tempWebAppUrl}...`),
  );

  const originalConsole = global.console;
  global.console = { ...originalConsole, log: () => {} };

  const app = next({ dev: true, quiet: true });
  await app.prepare();
  const handle = app.getRequestHandler();
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url ?? "", true));
  });
  server.listen(tempAppPort);

  logger.log(" Done.");

  process.stdout.write(
    chalk.blue(
      'The above step is skipped if you run "yarn dev" in another terminal. Doing so speed up the command.\n',
    ),
  );

  if (!(await checkIfWebAppIsLaunched(tempWebAppUrl, territoryConfig))) {
    throw new CommandError(
      `Unable to validate the web app at ${tempWebAppUrl}. Please report a bug.`,
    );
  }

  try {
    await action(tempWebAppUrl);
  } finally {
    process.stdout.write(
      chalk.green(`Stopping the web app at ${tempWebAppUrl}...`),
    );
    server.close();
    app.close();
    global.console = originalConsole;
    logger.log(" Done.");
  }
};
