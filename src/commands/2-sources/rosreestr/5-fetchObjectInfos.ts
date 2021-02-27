import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import { AxiosResponse } from "axios";
import chalk from "chalk";
import fs from "fs-extra";
import { DateTime } from "luxon";
import sortKeys from "sort-keys";

import { deepClean } from "../../../shared/deepClean";
import {
  getSerialisedNow,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import { processFiles } from "../../../shared/processFiles";
import {
  FirResponseInInfoPageResponse,
  getObjectInfoPagesDirPath,
  InfoPageData,
  PkkFeatureResponse,
  PkkResponseInInfoPageResponse,
  SuccessfulFirObjectResponse,
  SuccessfulFirObjectResponseInInfoPage,
} from "../../../shared/sources/rosreestr";
import { fetchJsonFromRosreestr } from "../../../shared/sources/rosreestr/fetchJsonFromRosreestr";
import { convertCnToId } from "../../../shared/sources/rosreestr/helpersForCn";

const assertNoUsefulData = (
  responseData: SuccessfulFirObjectResponseInInfoPage,
) => {
  if (responseData.parcelData?.oksYearBuilt) {
    throw new Error(
      `Did not expect to see oksYearBuilt in the flat ${responseData.objectId}. Maybe the script should be tweaked to harvest more data?`,
    );
  }
};

const processRawFirApiResponse = (
  rawApiResponse: AxiosResponse<unknown>,
): FirResponseInInfoPageResponse => {
  if (rawApiResponse.status === 204) {
    return "not-found";
  } else if (rawApiResponse.status !== 200) {
    throw new Error(`Unexpected response status ${rawApiResponse.status}`);
  }

  const rawResponseData = rawApiResponse.data as SuccessfulFirObjectResponse;
  const responseData = Object.fromEntries(
    Object.entries(rawResponseData).filter(([key]) => key !== "oldNumbers"),
  ) as SuccessfulFirObjectResponseInInfoPage;

  if (responseData.parcelData.oksType === "flat") {
    assertNoUsefulData(responseData);

    return "flat";
  } else if (!responseData.parcelData?.oksFlag) {
    assertNoUsefulData(responseData);

    return "lot";
  }

  return sortKeys(deepClean(responseData), { deep: true });
};

const processRawPkkFeatureResponse = (
  rawApiResponse: AxiosResponse<unknown>,
): PkkResponseInInfoPageResponse => {
  if (rawApiResponse.status !== 200) {
    throw new Error(`Unexpected API response status ${rawApiResponse.status}`);
  }
  const rawResponseData = rawApiResponse.data as PkkFeatureResponse;
  const feature = rawResponseData.feature;
  if (!feature) {
    return "not-found";
  }
  const oksType = feature.attrs.oks_type;
  if (!oksType) {
    return "lot";
  }

  if (oksType === "flat") {
    return "flat";
  }

  const center = feature.center
    ? ([feature.center.x, feature.center.y] as const)
    : undefined;
  const extent = feature.extent
    ? ([
        feature.extent.xmin,
        feature.extent.ymin,
        feature.extent.xmax,
        feature.extent.ymax,
      ] as const)
    : undefined;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const extent_parent = feature.extent_parent
    ? ([
        feature.extent_parent.xmin,
        feature.extent_parent.ymin,
        feature.extent_parent.xmax,
        feature.extent_parent.ymax,
      ] as const)
    : undefined;

  return sortKeys(
    deepClean({
      ...feature,
      center,
      extent,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      extent_parent,
    }),
    { deep: true },
  );
};

export const fetchObjectInfos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Fetching object infos"));

  const scriptStartTime = new Date();
  await processFiles({
    logger,
    fileSearchPattern: `**/page-*.json`,
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    showFilePath: true,
    processFile: async (filePath, prefixLength) => {
      const fileStat = await fs.stat(filePath);
      if (fileStat.mtime > scriptStartTime) {
        logger.log(
          chalk.yellow(
            `${" ".repeat(
              prefixLength,
            )}Skipping – this file is being handled by another instance of the script`,
          ),
        );

        return;
      }

      // Lock the page by updating mtime to prevent concurrent processing
      await fs.utimes(filePath, fileStat.atime, new Date());

      const infoPageData = (await fs.readJson(filePath)) as InfoPageData;
      process.stdout.write(" ".repeat(prefixLength));

      const indexesInRange = new Set<number>();
      const gapFetchRange = 100; // Set to 0 to not fetch gaps around known CNs
      for (let index = -1; index <= infoPageData.length; index += 1) {
        const shouldTreatAsAnchor =
          index === -1 ||
          index === infoPageData.length ||
          infoPageData[index]?.creationReason !== "gap";

        if (!shouldTreatAsAnchor) {
          continue;
        }

        for (
          let index2 = Math.max(0, index - gapFetchRange);
          index2 <= Math.min(infoPageData.length - 1, index + gapFetchRange);
          index2 += 1
        ) {
          const canInclude =
            infoPageData[index2]?.creationReason !== "lotInTile";
          if (canInclude) {
            indexesInRange.add(index2);
          }
        }
      }

      const minDate = DateTime.fromRFC2822("Fri, 26 Feb 2021 08:20:27 GMT");

      for (let index = 0; index < infoPageData.length; index += 1) {
        const originalObject = infoPageData[index]!;

        if (
          (indexesInRange.has(index) && !originalObject.firFetchedAt) ||
          (indexesInRange.has(index) &&
            originalObject.creationReason === "ccoInTile" &&
            originalObject.firFetchedAt &&
            originalObject.firResponse === "not-found" &&
            DateTime.fromRFC2822(originalObject.firFetchedAt) < minDate)
        ) {
          const featureId = convertCnToId(originalObject.cn);

          const firResponse = processRawFirApiResponse(
            await fetchJsonFromRosreestr(
              `https://rosreestr.gov.ru/api/online/fir_object/${featureId}`,
            ),
          );

          // For some reason, some objects are unavailable via rosreestr.gov.ru despite that they exist.
          // API of PKK is used as fallback (it contains less data, but the result is still useful)
          // Note that by including /5/ we limit the results to CCOs only (lots are under /1/).
          const pkkResponse =
            originalObject.firResponse === "not-found"
              ? processRawPkkFeatureResponse(
                  await fetchJsonFromRosreestr(
                    `https://pkk.rosreestr.ru/api/features/5/${featureId}`,
                  ),
                )
              : undefined;

          let result = originalObject;
          if (firResponse) {
            result = {
              ...result,
              firFetchedAt: getSerialisedNow(),
              firResponse,
            };
          }
          if (pkkResponse) {
            result = {
              ...result,
              pkkFetchedAt: getSerialisedNow(),
              pkkResponse,
            };
          }
          infoPageData[index] = result;

          await writeFormattedJson(filePath, infoPageData);
        }

        const object = infoPageData[index]!;

        let progressSymbol = "?";

        if (
          object.creationReason === "lotInTile" ||
          object.firResponse === "lot"
        ) {
          progressSymbol = "l";
        } else if (object.firResponse === "flat") {
          progressSymbol = "f";
        } else if (object.firResponse === "not-found") {
          progressSymbol = "•";
        } else if (typeof object.firResponse === "object") {
          progressSymbol = object.firResponse.parcelData?.oksType?.[0] ?? "?";
        } else if (typeof object.pkkResponse === "object") {
          progressSymbol = object.pkkResponse.attrs.oks_type?.[0] ?? "?";
        }

        if (object.creationReason !== "gap") {
          progressSymbol = progressSymbol.toUpperCase();
        }

        const progressColor =
          object !== originalObject
            ? chalk.magenta
            : !originalObject.firFetchedAt
            ? chalk.gray
            : chalk.cyan;

        const progressDecoration =
          infoPageData[index]?.firResponse === "not-found"
            ? chalk.inverse
            : chalk.reset;

        process.stdout.write(progressDecoration(progressColor(progressSymbol)));
      }
      await writeFormattedJson(filePath, infoPageData);
      logger.log("");
    },
  });
};

autoStartCommandIfNeeded(fetchObjectInfos, __filename);
