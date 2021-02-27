import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import { DateTime } from "luxon";

import { serializeTime } from "../../../shared/helpersForJson";
import {
  FirResponseInInfoPageResponse,
  InfoPageObject,
  PkkResponseInInfoPageResponse,
  processRosreestrPages,
} from "../../../shared/sources/rosreestr";

export const convertPagesFromOldFormat: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Converting pages from old format"));

  const minDateTime = DateTime.fromRFC2822("Fri, 26 Feb 2021 08:20:27 GMT");

  await processRosreestrPages({
    logger,

    pickObjectsToProcess: (allInfoPageObjects) => allInfoPageObjects,

    processObject: async (infoPageObject) => {
      const {
        fetchedAt,
        response,
        ...rest
      } = infoPageObject as InfoPageObject & {
        fetchedAt: string | null;
        response: FirResponseInInfoPageResponse | PkkResponseInInfoPageResponse;
      };

      if (fetchedAt === null) {
        return {
          ...rest,
          firFetchedAt: null,
          pkkFetchedAt: null,
        };
      } else if (!fetchedAt) {
        return infoPageObject;
      }

      const t = serializeTime(fetchedAt);

      if (response === "not-found" && DateTime.fromISO(t) > minDateTime) {
        return {
          ...rest,
          firFetchedAt: t,
          firResponse: response,
          pkkFetchedAt: t,
          pkkResponse: response,
        };
      }

      if (typeof response === "object" && "attrs" in response) {
        return {
          ...rest,
          firFetchedAt: t,
          firResponse: "not-found",
          pkkFetchedAt: t,
          pkkResponse: response,
        };
      }

      return {
        ...rest,
        firFetchedAt: t,
        firResponse: response,
        pkkFetchedAt: null,
      };
    },
  });
};

autoStartCommandIfNeeded(convertPagesFromOldFormat, __filename);
