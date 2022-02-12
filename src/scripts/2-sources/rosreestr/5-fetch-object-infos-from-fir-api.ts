import { AxiosResponse } from "axios";
import chalk from "chalk";
import sortKeys from "sort-keys";

import { deepClean } from "../../../shared/deep-clean";
import { serializeTime } from "../../../shared/helpers-for-json";
import {
  convertCnToId,
  fetchJsonFromRosreestr,
  FirResponseInInfoPageResponse,
  processRosreestrPages,
  SuccessfulFirObjectResponse,
  SuccessfulFirObjectResponseInInfoPage,
} from "../../../shared/sources/rosreestr";

const output = process.stdout;

const assertNoUsefulData = (
  responseData: SuccessfulFirObjectResponseInInfoPage,
) => {
  if (responseData.parcelData.oksYearBuilt) {
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

  const rawResponseData = rawApiResponse.data;
  const responseData = Object.fromEntries(
    Object.entries(rawResponseData as SuccessfulFirObjectResponse).filter(
      ([key]) => key !== "oldNumbers",
    ),
  ) as SuccessfulFirObjectResponseInInfoPage | undefined;

  // https://github.com/kachkaev/tooling-for-how-old-is-this-house/issues/17
  // TODO: Fix retry logic in fetchJsonFromRosreestr once API response is known.
  if (!responseData?.parcelData) {
    throw new Error(
      `Unexpected empty parcel data in response.\nContext: https://github.com/kachkaev/tooling-for-how-old-is-this-house/issues/17\nData: ${JSON.stringify(
        responseData,
      )}`,
    );
  }

  if (responseData.parcelData.oksType === "flat") {
    assertNoUsefulData(responseData);

    return "flat";
  } else if (!responseData.parcelData.oksFlag) {
    assertNoUsefulData(responseData);

    return "lot";
  }

  return sortKeys(deepClean(responseData), { deep: true });
};

const script = async () => {
  output.write(
    chalk.bold(
      "sources/rosreestr: Fetching object infos from FIR API (https://rosreestr.gov.ru/api/online/fir_object/...)\n",
    ),
  );

  await processRosreestrPages({
    output,
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

await script();
