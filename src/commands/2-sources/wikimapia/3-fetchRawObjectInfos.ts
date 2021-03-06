import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import axios from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import sleep from "sleep-promise";

import { generateProgress } from "../../../shared/helpersForCommands";
import { prependCommentWithTimeToHtml } from "../../../shared/helpersForHtml";
import {
  combineWikimapiaTiles,
  deriveWikimapiaObjectFilePath,
  getWikimapiaRawObjectInfoFileSuffix,
} from "../../../shared/sources/wikimapia";

axiosRetry(axios);

const desiredPageLanguage = "ru";

export const fetchRawObjectInfos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/wikimapia: Fetching raw object infos"));

  const { objectExtentFeatures } = await combineWikimapiaTiles({ logger });

  for (let index = 0; index < objectExtentFeatures.length; index += 1) {
    const objectExtentFeature = objectExtentFeatures[index]!;

    const wikimapiaId = objectExtentFeature.properties?.wikimapiaId;
    if (!wikimapiaId) {
      throw new Error(`Unexpected empty wikimapia at index ${index}`);
    }

    const rawObjectInfoFilePath = deriveWikimapiaObjectFilePath(
      wikimapiaId,
      getWikimapiaRawObjectInfoFileSuffix(),
    );

    if (await fs.pathExists(rawObjectInfoFilePath)) {
      logger.log(
        `${generateProgress(index, objectExtentFeatures.length)} ${chalk.gray(
          rawObjectInfoFilePath,
        )}`,
      );

      continue;
    }

    const response = await axios.get<string>(
      `https://wikimapia.org/${wikimapiaId}/${desiredPageLanguage}/`,
      {
        timeout: 10000,
        "axios-retry": {
          retries: 30,
          retryDelay: (retryCount) => retryCount * 5000,
          retryCondition: (error) =>
            ![200, 404].includes(error.response?.status ?? 0),
          shouldResetTimeout: true,
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.16; rv:85.0) Gecko/20100101 Firefox/85.0",
        },
      },
    );
    if (response.status !== 200) {
      throw new Error(`Unexpected status ${response.status}`);
    }

    await fs.ensureDir(path.dirname(rawObjectInfoFilePath));
    await fs.writeFile(
      rawObjectInfoFilePath,
      prependCommentWithTimeToHtml(response.data),
      "utf8",
    );

    // cooling off period is needed to avoid 503 responses following API abuse
    await sleep(1000);

    logger.log(
      `${generateProgress(index, objectExtentFeatures.length)} ${chalk.magenta(
        rawObjectInfoFilePath,
      )}`,
    );
  }
};

autoStartCommandIfNeeded(fetchRawObjectInfos, __filename);
