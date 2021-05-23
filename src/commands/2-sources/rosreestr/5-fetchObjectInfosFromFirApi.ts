import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import { AxiosResponse } from "axios";
import chalk from "chalk";
import sortKeys from "sort-keys";

import { deepClean } from "../../../shared/deepClean";
import { serializeTime } from "../../../shared/helpersForJson";
import {
  convertCnToId,
  fetchJsonFromRosreestr,
  FirResponseInInfoPageResponse,
  processRosreestrPages,
  SuccessfulFirObjectResponse,
  SuccessfulFirObjectResponseInInfoPage,
} from "../../../shared/sources/rosreestr";

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
    return "void";
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

export const fetchObjectInfosFromFirApi: Command = async ({ logger }) => {
  logger.log(
    chalk.bold(
      "sources/rosreestr: Fetching object infos from FIR API (https://rosreestr.gov.ru/api/online/fir_object/...)",
    ),
  );

  await processRosreestrPages({
    logger,
    processObject: async (infoPageObject) => {
      if (
        infoPageObject.creationReason === "lotInTile" ||
        infoPageObject.firFetchedAt
      ) {
        return infoPageObject;
      }

      const firResponse = processRawFirApiResponse(
        await fetchJsonFromRosreestr(
          `https://rosreestr.gov.ru/api/online/fir_object/${convertCnToId(
            infoPageObject.cn,
          )}`,
        ),
      );

      return sortKeys({
        ...infoPageObject,
        firFetchedAt: serializeTime(),
        firResponse,
      });
    },
  });
};

autoStartCommandIfNeeded(fetchObjectInfosFromFirApi, __filename);
