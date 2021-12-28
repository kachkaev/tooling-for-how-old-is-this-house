import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import { AxiosResponse } from "axios";
import chalk from "chalk";
import * as envalid from "envalid";
import sortKeys from "sort-keys";

import { cleanEnv } from "../../../shared/cleanEnv";
import { deepClean } from "../../../shared/deepClean";
import { serializeTime } from "../../../shared/helpersForJson";
import {
  checkIfFirResponseContainsExistingBuilding,
  compressRosreestrCenter,
  compressRosreestrExtent,
  convertCnToId,
  extractCompletionTimeFromFirResponse,
  fetchJsonFromRosreestr,
  InfoPageObject,
  pauseBetweenPkkApiRequestsToAvoid403,
  PkkFeatureResponse,
  PkkResponseInInfoPageResponse,
  processRosreestrPages,
} from "../../../shared/sources/rosreestr";

const checkIfNeedsProcessing = (infoPageObject: InfoPageObject): boolean => {
  if (
    infoPageObject.creationReason === "lotInTile" ||
    infoPageObject.pkkResponse
  ) {
    return false;
  }

  // Responses in PKK and FIR API may vary.
  // If FIR API does not report completion time, the value might still be found via PKK API.
  // Example: 58:29:1007003:5108
  const firResponse = infoPageObject.firResponse;
  if (typeof firResponse === "object") {
    if (!checkIfFirResponseContainsExistingBuilding(firResponse)) {
      return false;
    }
    const completionTime = extractCompletionTimeFromFirResponse(firResponse);

    if (completionTime) {
      return false;
    }

    const normalizedObjectName =
      firResponse.objectData.objectName?.toLowerCase() ?? "";
    if (normalizedObjectName.match(/гараж|сарай|садов/)) {
      return false;
    }

    return true;
  }

  return firResponse === "void";
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
    return "void";
  }
  const oksType = feature.attrs.oks_type;
  if (!oksType) {
    return "notOks";
  }

  if (oksType === "flat") {
    return "flat";
  }

  return sortKeys(
    deepClean({
      ...feature,
      center: feature.center
        ? compressRosreestrCenter(feature.center)
        : undefined,
      extent: feature.extent
        ? compressRosreestrExtent(feature.extent)
        : undefined,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      extent_parent: feature.extent_parent
        ? compressRosreestrExtent(feature.extent_parent)
        : undefined,
    }),
    { deep: true },
  );
};

const command: Command = async ({ logger }) => {
  logger.log(
    chalk.bold(
      "sources/rosreestr: Fetching object infos from FIR API (https://pkk.rosreestr.ru/api/features/...)",
    ),
  );

  const env = cleanEnv({
    RANGE: envalid.num({
      default: 0,
      desc: "Number of CNs to fetch around anchor CNs",
    }),
  });

  await processRosreestrPages({
    concurrencyDisabledReason:
      "PKK API returns 403 for a few hours after receiving more than ≈50 requests per minute.",
    logger,
    findAnchorObjects: (infoPageObjects) =>
      infoPageObjects.filter(
        (infoPageObject) =>
          infoPageObject.creationReason !== "gap" ||
          (infoPageObject.firResponse &&
            infoPageObject.firResponse !== "void") ||
          (infoPageObject.pkkResponse && infoPageObject.pkkResponse !== "void"),
      ),
    includeObjectsAroundAnchors: env.RANGE,
    includeObjectsAroundEnds: env.RANGE,
    processObject: async (infoPageObject) => {
      if (!checkIfNeedsProcessing(infoPageObject)) {
        return infoPageObject;
      }

      const featureId = convertCnToId(infoPageObject.cn);

      const pkkResponse = processRawPkkFeatureResponse(
        await fetchJsonFromRosreestr(
          `https://pkk.rosreestr.ru/api/features/5/${featureId}`,
        ),
      );

      await pauseBetweenPkkApiRequestsToAvoid403();

      return sortKeys({
        ...infoPageObject,
        pkkFetchedAt: serializeTime(),
        pkkResponse,
      });
    },
  });
};

autoStartCommandIfNeeded(command, __filename);

export default command;
