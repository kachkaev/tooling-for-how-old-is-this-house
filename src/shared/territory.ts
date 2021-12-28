import * as turf from "@turf/turf";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import { load } from "js-yaml";
import _ from "lodash";
import path from "path";

import {
  AddressHandlingConfig,
  compileAddressHandlingConfig,
  RawAddressHandlingConfig,
  WordReplacementConfig,
} from "./addresses";
import { cleanEnv } from "./cleanEnv";
import { ReportIssue } from "./issues";

export type TerritoryExtent = turf.Feature<turf.Polygon>;

export const getTerritoryDirPath = (): string => {
  const env = cleanEnv({
    TERRITORY_DATA_DIR_PATH: envalid.str({}),
  });

  return path.resolve(env.TERRITORY_DATA_DIR_PATH);
};

export const getTerritoryId = (): string => {
  return path
    .basename(getTerritoryDirPath())
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
};

export interface TerritoryConfig {
  name?: string;

  extent?: {
    elementsToCombine?: Array<
      | { type: "osmRelation"; relationId: number }
      | { type: "osmWay"; wayId: number }
      | { type: never }
    >;
  };

  sources?: {
    mingkh?: {
      houseLists?: Array<
        | {
            regionUrl?: string;
            cityUrl?: string;
          }
        | undefined
      >;
    };
    mkrf?: {
      fallbackAddressSelectorsForObjectsWithoutGeometry?: string[] | string[][];
      fixedLonLatById?: Record<string, [number, number]>;
    };
    rosreestr?: {
      handpickedCnsForPageInfos?: string[];
    };
    wikivoyage?: {
      pagesToFetch?: string[];
    };
  };
  addressHandling?: RawAddressHandlingConfig;
  [rest: string]: unknown;
}

export const getTerritoryConfigFilePath = (): string =>
  path.resolve(getTerritoryDirPath(), `territory-config.yml`);

export const getTerritoryConfig = async (): Promise<TerritoryConfig> => {
  return load(await fs.readFile(getTerritoryConfigFilePath(), "utf8")) as any;
};

export const getTerritoryExtentFilePath = (): string =>
  path.resolve(getTerritoryDirPath(), `territory-extent.geojson`);

export const getTerritoryExtent = async (): Promise<TerritoryExtent> => {
  const filePath = getTerritoryExtentFilePath();
  const territoryExtent = (await fs.readJson(filePath)) as turf.Feature;
  if (territoryExtent?.type !== "Feature") {
    throw new Error(
      `Expected ${filePath} to contain a geojson Feature, got: ${territoryExtent?.type}`,
    );
  }

  if (territoryExtent?.geometry?.type !== "Polygon") {
    throw new Error(
      `Expected ${filePath} to contain a geojson Feature with Polygon, got: ${territoryExtent?.geometry?.type}`,
    );
  }

  return territoryExtent as TerritoryExtent;
};

const sanitizeWordReplacements = (
  rawWordReplacements: unknown,
  reportIssue?: ReportIssue,
): WordReplacementConfig[] => {
  if (!Array.isArray(rawWordReplacements)) {
    if (typeof rawWordReplacements !== "undefined") {
      reportIssue?.(
        `Expected word replacements to be an array, got ${typeof rawWordReplacements}`,
      );
    }

    return [];
  }
  const result: WordReplacementConfig[] = [];

  for (const rawWordReplacement of rawWordReplacements as unknown[]) {
    const stringifiedRawWordReplacement = JSON.stringify(rawWordReplacement);

    if (
      !_.isObject(rawWordReplacement) ||
      !("from" in rawWordReplacement) ||
      !("to" in rawWordReplacement)
    ) {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected an object with "from" and "to" keys)`,
      );
      continue;
    }

    const { detached, from, to, silenceNormalizationWarning } =
      rawWordReplacement as Record<string, unknown>;

    if (typeof to !== "string") {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected "to" to be a string)`,
      );
      continue;
    }

    if (typeof from !== "string" && !Array.isArray(from)) {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected "from" to be a string or an array of strings)`,
      );
      continue;
    }

    let sanitizedFrom = from;
    if (Array.isArray(from)) {
      sanitizedFrom = [];
      for (const fromElement of from) {
        if (typeof fromElement !== "string") {
          reportIssue?.(
            `Skipping from ${JSON.stringify(
              fromElement,
            )} in ${stringifiedRawWordReplacement} (expected a string)`,
          );
        } else {
          sanitizedFrom.push(fromElement);
        }
      }
    }

    if (typeof detached !== "undefined" && typeof detached !== "boolean") {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected "detached" to be a boolean)`,
      );
      continue;
    }

    if (
      typeof silenceNormalizationWarning !== "undefined" &&
      typeof silenceNormalizationWarning !== "boolean"
    ) {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected "silenceNormalizationWarning" to be a boolean)`,
      );
      continue;
    }

    result.push({
      detached,
      from: sanitizedFrom,
      silenceNormalizationWarning,
      to,
    });
  }

  return result;
};

const sanitizeRawAddressHandlingConfig = (
  userInput: unknown,
  reportIssue?: ReportIssue,
): RawAddressHandlingConfig => {
  if (!_.isObject(userInput)) {
    if (userInput !== undefined && userInput !== null) {
      reportIssue?.(`Expected object, got ${typeof userInput}`);
    }

    return {};
  }

  const { wordReplacements, canonicalSpellings, defaultRegion } =
    userInput as Record<string, unknown>;

  const sanitizedCanonicalSpellings: string[] = [];
  let sanitizedDefaultRegion: string | undefined = undefined;

  if (Array.isArray(canonicalSpellings)) {
    canonicalSpellings.forEach((canonicalSpelling, index) => {
      if (typeof canonicalSpelling !== "string") {
        reportIssue?.(
          `Ignoring canonicalSpelling[${index}] (expected string got ${typeof canonicalSpelling})`,
        );

        return;
      }

      sanitizedCanonicalSpellings.push(canonicalSpelling);
    });
  } else if (canonicalSpellings !== undefined && canonicalSpellings !== null) {
    reportIssue?.(
      `Ignoring canonicalSpellings (expected array, got ${typeof defaultRegion})`,
    );
  }

  if (defaultRegion !== undefined && defaultRegion !== null) {
    if (typeof defaultRegion !== "string") {
      reportIssue?.(
        `Ignoring defaultRegion (expected string, got ${typeof defaultRegion})`,
      );
    } else {
      sanitizedDefaultRegion = defaultRegion;
    }
  }

  return {
    canonicalSpellings: sanitizedCanonicalSpellings,
    defaultRegion: sanitizedDefaultRegion,
    wordReplacements: sanitizeWordReplacements(wordReplacements),
  };
};

export const getTerritoryAddressHandlingConfig = async (
  logger: Console | undefined,
): Promise<AddressHandlingConfig> => {
  const territoryConfig = await getTerritoryConfig();

  const reportIssue: ReportIssue = (issue) =>
    logger?.log(
      chalk.yellow(`territory-config.yml → addressHandling: ${issue}`),
    );

  const rawAddressHandlingConfig = sanitizeRawAddressHandlingConfig(
    territoryConfig.addressHandling,
    reportIssue,
  );

  return compileAddressHandlingConfig(rawAddressHandlingConfig, reportIssue);
};

export const ensureTerritoryGitignoreContainsLine = async (
  line: string,
): Promise<void> => {
  const filePath = path.resolve(getTerritoryDirPath(), ".gitignore");
  await fs.ensureDir(path.dirname(filePath));
  await fs.ensureFile(filePath);
  const fileContent = await fs.readFile(filePath, "utf8");
  let linesInFile = fileContent.trim().split(/\r?\n/);

  if (!linesInFile.includes(line)) {
    linesInFile.push(line);
  }

  const fileHasCommentsOrGaps = linesInFile.find(
    (lineInFile) => lineInFile.startsWith("#") || lineInFile.trim() === "",
  );

  if (!fileHasCommentsOrGaps) {
    linesInFile = _.uniq(
      linesInFile
        .map((lineInFile) => lineInFile.trim())
        .filter((lineInFile) => lineInFile.length)
        .sort(),
    );
  }

  const desiredFileContent = `${linesInFile.join("\n")}\n`;
  if (desiredFileContent !== fileContent) {
    await fs.writeFile(filePath, desiredFileContent);
  }
};
