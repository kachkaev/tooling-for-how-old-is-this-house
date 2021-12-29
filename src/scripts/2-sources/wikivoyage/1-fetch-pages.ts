import axios from "axios";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import { prependCommentWithJsonToHtml } from "../../../shared/helpersForHtml";
import { serializeTime } from "../../../shared/helpersForJson";
import { ScriptError } from "../../../shared/helpersForScripts";
import {
  getWikivoyagePageFileSuffix,
  getWikivoyagePagesDir,
  WikivoyagePageMetadata,
} from "../../../shared/sources/wikivoyage";
import {
  getTerritoryConfig,
  getTerritoryConfigFilePath,
} from "../../../shared/territory";

const output = process.stdout;

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

const script = async () => {
  output.write(chalk.bold("sources/wikivoyage: Fetching pages\n"));

  const pagesToFetch = (await getTerritoryConfig())?.sources?.wikivoyage
    ?.pagesToFetch as unknown;
  if (!(pagesToFetch instanceof Array)) {
    throw new ScriptError(
      `Expected ${getTerritoryConfigFilePath()} → sources → wikivoyage → pagesToFetch to be an array, got ${pagesToFetch}`,
    );
  }

  const urls: string[] = [];
  for (const pageToFetch of pagesToFetch) {
    if (typeof pageToFetch !== "string" || !pageToFetch.startsWith(urlPrefix)) {
      output.write(
        chalk.yellow(
          `Expected ${getTerritoryConfigFilePath()} → sources → wikivoyage → pagesToFetch to contain URLs starting with ${urlPrefix}. Skipping ${pageToFetch}.\n`,
        ),
      );
      continue;
    }
    urls.push(pageToFetch);
  }

  if (!urls.length) {
    throw new ScriptError(
      `Could not find any pages to fetch. Please check ${getTerritoryConfigFilePath()} → sources → wikivoyage → pagesToFetch.`,
    );
  }

  output.write(chalk.green("Fetching...\n"));

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
    output.write(`${chalk.magenta(filePath)}\n`);
  }

  output.write("Done.\n");
};

await script();
