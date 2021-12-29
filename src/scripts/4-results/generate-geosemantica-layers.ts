import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sortKeys from "sort-keys";

import { deepClean } from "../../shared/deepClean";
import {
  GeographicContextFeature,
  GeographicContextFeatureGeometry,
  GeographicContextFeatureProperties,
  GeographicContextWaySize,
  splitGeographicContext,
} from "../../shared/geographicContext";
import { generateGeographicContext } from "../../shared/geographicContext/generateGeographicContext";
import { writeFormattedJson } from "../../shared/helpersForJson";
import {
  getMixedPropertyVariantsFilePath,
  MixedPropertyVariants,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/mixing";
import { OutputGeometry } from "../../shared/outputLayers";
import {
  ensureTerritoryGitignoreContainsResults,
  generateVersionSuffix,
  getResultsDirPath,
} from "../../shared/results";
import {
  getTerritoryAddressHandlingConfig,
  getTerritoryExtent,
  getTerritoryId,
} from "../../shared/territory";

const output = process.stdout;

interface MainLayerProperties {
  fid: number;

  /* eslint-disable @typescript-eslint/naming-convention */
  /** Using ‘adress’ instead of ‘address’ for consistency with first uploaded cities */
  r_adress?: null | string;
  r_architect?: null | string;
  r_copyrights?: null | string;
  r_floors?: null | number;
  r_mkrf?: null | string;
  r_name?: null | string;
  r_photo_url?: null | string;
  r_style?: null | string;
  r_url?: null | string;
  r_wikidata?: null | string;
  r_wikipedia?: null | string;
  r_year_int?: null | number;
  r_years_str?: null | string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

type BuildingsLayerFeature = turf.Feature<OutputGeometry, MainLayerProperties>;

// Geosemantica has issues with applying styles when properties use camelCase.
// We replace relativeSize with relative_size as a workaround.
// TODO: Improve typings (may via template literal types?)
type GeographicContextLayerFeatureProperties =
  | (Omit<GeographicContextFeatureProperties, "relativeSize"> & {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      relative_size?: GeographicContextWaySize;
    })
  | { category: "building" };

type GeographicContextLayerFeature = turf.Feature<
  GeographicContextFeatureGeometry,
  GeographicContextLayerFeatureProperties
>;

// Placeholder properties are added to the first feature of the resulting feature collection.
// This ensures property list completeness and order in apps like QGIS.
const placeholderProperties: Record<keyof MainLayerProperties, null> = {
  /* eslint-disable @typescript-eslint/naming-convention */

  // Properties are ordered to match the desired layout of building cards
  r_name: null,
  r_photo_url: null,
  r_adress: null,
  r_years_str: null,
  r_floors: null,
  r_architect: null,
  r_style: null,

  r_mkrf: null,
  r_wikipedia: null,
  r_wikidata: null,
  r_url: null,

  r_copyrights: null,

  r_year_int: null,
  fid: null,
  /* eslint-enable @typescript-eslint/naming-convention */
};

const orderedPropertyKeys = Object.keys(placeholderProperties);
const comparePropertyKeys = (a: string, b: string) => {
  if (a === b) {
    return 0;
  }

  return orderedPropertyKeys.indexOf(a) > orderedPropertyKeys.indexOf(b)
    ? 1
    : -1;
};

/**
 * It has been noticed that Geosemantica breaks URLs with '. For example:
 *
 *    https://commons.wikimedia.org/wiki/Special:FilePath/Bishop's%20residence%20Penza.jpg?width=1000
 *
 * becomes
 *
 *   https://commons.wikimedia.org/wiki/Special:FilePath/Bishops%20residence%20Penza.jpg?width=1000
 *
 * and returns 404.
 *
 * This problem is avoided by replacing ' with %27. The same encoding trick
 * is applied to a few more characters just in case.
 *
 * @see https://stackoverflow.com/a/18251730/1818285
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
 */
const fixUrlForGeosemantica = (
  url: string | undefined | null,
): string | undefined | null => {
  return url?.replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16)}`,
  );
};

const generateCopyrights = ({
  photoUrl,
  photoSource,
  photoAuthorName,
  photoAuthorUrl,
}: MixedPropertyVariants): string | undefined => {
  if (!photoSource || !photoUrl) {
    return undefined;
  }

  if (photoUrl?.startsWith("https://commons.wikimedia.org")) {
    return `фото: Викимедя Коммонс`;
  }

  switch (photoSource) {
    case "mkrf":
      return `фото: Министерство культуры РФ`;
    case "wikimapia":
      return photoAuthorName && photoAuthorName !== "Guest"
        ? `фото: Викимапия (участник ${photoAuthorName})`
        : `фото: Викимапия`;
  }

  return `фото: ${[photoAuthorName, photoAuthorUrl]
    .filter((v) => Boolean(v))
    .join(", ")}`;
};

const mapBackgroundOrForegroundFeatureProperties = (
  features: GeographicContextFeature[],
): GeographicContextLayerFeature[] =>
  features.map((feature) => ({
    ...feature,
    properties: _.mapKeys(feature.properties, (value, key) => _.snakeCase(key)),
  })) as unknown[] as GeographicContextLayerFeature[];

const script = async () => {
  output.write(chalk.bold("results: Generating Geosemantica layers\n"));

  output.write(chalk.green("Loading mixed property variants..."));
  const inputFileName = getMixedPropertyVariantsFilePath();
  const inputFeatureCollection = (await fs.readJson(
    inputFileName,
  )) as MixedPropertyVariantsFeatureCollection;

  output.write(` Done.\n`);

  output.write(chalk.green("Loading geographic context..."));
  const geographicContextFeatureCollection = await generateGeographicContext(
    await getTerritoryExtent(),
  );

  output.write(` Done.\n`);

  output.write(chalk.green("Processing..."));

  const { backgroundFeatureCollection, foregroundFeatureCollection } =
    splitGeographicContext(geographicContextFeatureCollection);

  const backgroundLayerFeatures: GeographicContextLayerFeature[] =
    mapBackgroundOrForegroundFeatureProperties(
      backgroundFeatureCollection.features,
    );
  const buildingsLayerFeatures: BuildingsLayerFeature[] = [];
  const foregroundLayerFeatures: GeographicContextLayerFeature[] =
    mapBackgroundOrForegroundFeatureProperties(
      foregroundFeatureCollection.features,
    );

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(output);

  const addressPrefixToRemove = addressHandlingConfig.defaultRegion
    ? `${addressHandlingConfig.defaultRegion.toLowerCase()}, `
    : undefined;

  const removeDefaultRegionFromAddress = (
    address: string | undefined,
  ): string | undefined => {
    if (!address) {
      return undefined;
    }

    if (
      !addressPrefixToRemove ||
      !address.toLowerCase().startsWith(addressPrefixToRemove)
    ) {
      return address;
    }

    return address.substr(addressPrefixToRemove.length);
  };

  for (const inputFeature of inputFeatureCollection.features) {
    const index = buildingsLayerFeatures.length;
    const fid = index + 1;
    const outputFeatureProperties: MainLayerProperties = deepClean({
      fid,

      /* eslint-disable @typescript-eslint/naming-convention */
      r_adress: removeDefaultRegionFromAddress(
        inputFeature.properties.derivedBeautifiedAddress ??
          inputFeature.properties.address ??
          undefined,
      ),
      r_architect: inputFeature.properties.architect,
      r_copyrights: generateCopyrights(inputFeature.properties),
      r_floors: inputFeature.properties.floorCountAboveGround,
      r_mkrf: fixUrlForGeosemantica(inputFeature.properties.mkrfUrl),
      r_name: inputFeature.properties.derivedBeautifiedName,
      r_photo_url: fixUrlForGeosemantica(inputFeature.properties.photoUrl),
      r_style: inputFeature.properties.style,
      r_url: fixUrlForGeosemantica(inputFeature.properties.url),
      r_wikidata: fixUrlForGeosemantica(inputFeature.properties.wikidataUrl),
      r_wikipedia: fixUrlForGeosemantica(inputFeature.properties.wikipediaUrl),
      r_year_int: inputFeature.properties.derivedCompletionYear,
      r_years_str: inputFeature.properties.derivedCompletionTimeForGeosemantica,
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    buildingsLayerFeatures.push(
      turf.feature(
        inputFeature.geometry,
        sortKeys(
          index === 0
            ? { ...placeholderProperties, ...outputFeatureProperties }
            : outputFeatureProperties,
          { compare: comparePropertyKeys },
        ),
      ),
    );
    backgroundLayerFeatures.push(
      turf.feature(inputFeature.geometry, { category: "building" }),
    );
  }

  output.write(` Done.\n`);
  output.write(chalk.green(`Saving...`));

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();
  const backgroundLayerFilePath = path.resolve(
    getResultsDirPath(),
    `${territoryId}.geosemantica-layer.${version}.background.geojson`,
  );
  const buildingsLayerFilePath = path.resolve(
    getResultsDirPath(),
    `${territoryId}.geosemantica-layer.${version}.buildings.geojson`,
  );
  const foregroundLayerFilePath = path.resolve(
    getResultsDirPath(),
    `${territoryId}.geosemantica-layer.${version}.foreground.geojson`,
  );

  await writeFormattedJson(
    backgroundLayerFilePath,
    turf.featureCollection(backgroundLayerFeatures),
  );
  await writeFormattedJson(
    buildingsLayerFilePath,
    turf.featureCollection(buildingsLayerFeatures),
  );
  await writeFormattedJson(
    foregroundLayerFilePath,
    turf.featureCollection(foregroundLayerFeatures),
  );

  output?.write(
    ` Result saved to:\n${
      chalk.magenta(backgroundLayerFilePath) //
    }\n${
      chalk.magenta(buildingsLayerFilePath) //
    }\n${
      chalk.magenta(foregroundLayerFilePath) //
    }\n`,
  );
};

await script();
