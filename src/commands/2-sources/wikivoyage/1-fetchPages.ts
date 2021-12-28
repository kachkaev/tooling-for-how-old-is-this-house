import {
  autoStartCommandIfNeeded,
  Command,
  CommandError,
} from "@kachkaev/commands";
import axios from "axios";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import { prependCommentWithJsonToHtml } from "../../../shared/helpersForHtml";
import { serializeTime } from "../../../shared/helpersForJson";
import {
  getWikivoyagePageFileSuffix,
  getWikivoyagePagesDir,
  WikivoyagePageMetadata,
} from "../../../shared/sources/wikivoyage";
import {
  getTerritoryConfig,
  getTerritoryConfigFilePath,
} from "../../../shared/territory";

const urlPrefix = "https://ru.wikivoyage.org/wiki/";

interface ApiResponseData {
  id: number;
  key: string;
  title: string;
  latest: {
    id: number;
    timestamp: string;
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  content_model: "wikitext";
  license: {
    url: string;
    title: string;
  };
  source: string;
}

const command: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/wikivoyage: Fetching pages"));

  const pagesToFetch = (await getTerritoryConfig())?.sources?.wikivoyage
    ?.pagesToFetch as unknown;
  if (!(pagesToFetch instanceof Array)) {
    throw new CommandError(
      `Expected ${getTerritoryConfigFilePath()} → sources → wikivoyage → pagesToFetch to be an array, got ${pagesToFetch}`,
    );
  }

  const urls: string[] = [];
  for (const pageToFetch of pagesToFetch) {
    if (typeof pageToFetch !== "string" || !pageToFetch.startsWith(urlPrefix)) {
      logger.log(
        chalk.yellow(
          `Expected ${getTerritoryConfigFilePath()} → sources → wikivoyage → pagesToFetch to contain URLs starting with ${urlPrefix}. Skipping ${pageToFetch}.`,
        ),
      );
      continue;
    }
    urls.push(pageToFetch);
  }

  if (!urls.length) {
    throw new CommandError(
      `Could not find any pages to fetch. Please check ${getTerritoryConfigFilePath()} → sources → wikivoyage → pagesToFetch.`,
    );
  }

  logger.log(chalk.green("Fetching..."));

  for (const url of urls) {
    const pageName = url.substr(urlPrefix.length);
    const apiUrl = `https://ru.wikivoyage.org/w/rest.php/v1/page/${encodeURIComponent(
      pageName,
    )}`;
    const apiResponseData = (
      await axios.get<ApiResponseData>(apiUrl, { responseType: "json" })
    ).data;
    const filePath = `${getWikivoyagePagesDir()}/${pageName}${getWikivoyagePageFileSuffix()}`;

    const {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      content_model,
      source,
      ...rawMetadata
    } = apiResponseData;

    const metadata: WikivoyagePageMetadata = {
      ...rawMetadata,
      fetchedAt: serializeTime(),
    };

    const wikiTextToWrite = prependCommentWithJsonToHtml(source, metadata);
    await fs.mkdirp(path.dirname(filePath));
    await fs.writeFile(filePath, wikiTextToWrite);
    logger.log(chalk.magenta(filePath));
  }

  logger.log("Done.");
};

autoStartCommandIfNeeded(command, __filename);

export default command;
