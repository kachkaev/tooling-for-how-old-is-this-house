import axios from "axios";
import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";

import { prependCommentWithJsonToHtml } from "../../../shared/helpers-for-html";
import { serializeTime } from "../../../shared/helpers-for-json";
import { ScriptError } from "../../../shared/scripts";
import {
  getWikivoyagePageFileSuffix,
  getWikivoyagePagesDir,
  WikivoyagePageMetadata,
} from "../../../shared/source-wikivoyage";
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

  const territoryConfig = await getTerritoryConfig();
  const pagesToFetch = territoryConfig.sources?.wikivoyage
    ?.pagesToFetch as unknown;
  if (!Array.isArray(pagesToFetch)) {
    throw new ScriptError(
      `Expected ${getTerritoryConfigFilePath()} → sources → wikivoyage → pagesToFetch to be an array, got ${typeof pagesToFetch}`,
    );
  }

  const urls: string[] = [];
  for (const pageToFetch of pagesToFetch) {
    if (typeof pageToFetch !== "string" || !pageToFetch.startsWith(urlPrefix)) {
      output.write(
        chalk.yellow(
          `Expected ${getTerritoryConfigFilePath()} → sources → wikivoyage → pagesToFetch to contain URLs starting with ${urlPrefix}. Skipping ${JSON.stringify(
            pageToFetch,
          )}.\n`,
        ),
      );
      continue;
    }
    urls.push(pageToFetch);
  }

  if (urls.length === 0) {
    throw new ScriptError(
      `Could not find any pages to fetch. Please check ${getTerritoryConfigFilePath()} → sources → wikivoyage → pagesToFetch.`,
    );
  }

  output.write(chalk.green("Fetching...\n"));

  for (const url of urls) {
    const pageName = url.slice(urlPrefix.length);
    const apiUrl = `https://ru.wikivoyage.org/w/rest.php/v1/page/${encodeURIComponent(
      pageName,
    )}`;
    const { data: apiResponseData } = await axios.get<ApiResponseData>(apiUrl, {
      responseType: "json",
      transitional: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- external API
        silentJSONParsing: false, // Disables Object to string conversion if parsing fails
      },
    });
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
