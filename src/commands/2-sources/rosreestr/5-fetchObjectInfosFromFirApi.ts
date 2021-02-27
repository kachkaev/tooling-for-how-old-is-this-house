import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import { AxiosResponse } from "axios";
import chalk from "chalk";
import sortKeys from "sort-keys";

import { deepClean } from "../../../shared/deepClean";
import { getSerialisedNow } from "../../../shared/helpersForJson";
import {
  FirResponseInInfoPageResponse,
  processRosreestrPages,
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

export const fetchObjectInfos: Command = async ({ logger }) => {
  logger.log(
    chalk.bold(
      "sources/rosreestr: Fetching object infos from FIR API (https://rosreestr.gov.ru/api/online/fir_object/...)",
    ),
  );

  await processRosreestrPages({
    logger,

    pickObjectsToProcess: (allInfoPageObjects) => {
      const indexesInRange = new Set<number>();
      const gapFetchRange = 100; // Set to 0 to not fetch gaps around known CNs
      for (let index = -1; index <= allInfoPageObjects.length; index += 1) {
        const shouldTreatAsAnchor =
          index === -1 ||
          index === allInfoPageObjects.length ||
          allInfoPageObjects[index]?.creationReason !== "gap";

        if (!shouldTreatAsAnchor) {
          continue;
        }

        for (
          let index2 = Math.max(0, index - gapFetchRange);
          index2 <=
          Math.min(allInfoPageObjects.length - 1, index + gapFetchRange);
          index2 += 1
        ) {
          const canInclude =
            allInfoPageObjects[index2]?.creationReason !== "lotInTile";
          if (canInclude) {
            indexesInRange.add(index2);
          }
        }
      }

      return allInfoPageObjects.filter(
        (infoPageObject, index) =>
          indexesInRange.has(index) && infoPageObject.firFetchedAt,
      );
    },

    processObject: async (infoPageObject) => {
      const firResponse = processRawFirApiResponse(
        await fetchJsonFromRosreestr(
          `https://rosreestr.gov.ru/api/online/fir_object/${convertCnToId(
            infoPageObject.cn,
          )}`,
        ),
      );

      return {
        ...infoPageObject,
        firFetchedAt: getSerialisedNow(),
        firResponse,
      };
    },
  });
};

autoStartCommandIfNeeded(fetchObjectInfos, __filename);
