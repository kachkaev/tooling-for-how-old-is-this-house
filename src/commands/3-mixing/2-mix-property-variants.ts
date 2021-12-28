import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import { createBeautifyAddress } from "../../shared/addresses";
import { deepClean } from "../../shared/deepClean";
import { writeFormattedJson } from "../../shared/helpersForJson";
import {
  buildGlobalFeatureOrVariantId,
  DataToOmitSelector,
  ensureTerritoryGitignoreContainsMixing,
  getMixedOutputLayersFilePath,
  getMixedPropertyVariantsFilePath,
  ListRelevantPropertyVariants,
  matchDataToOmitSelectors,
  MixedOutputLayersFeature,
  MixedOutputLayersFeatureCollection,
  MixedPropertyVariants,
  MixedPropertyVariantsFeature,
  parseDataToOmit,
  pickAddress,
  pickArchitect,
  pickCompletionTime,
  pickFloorCount,
  pickMkrfUrl,
  pickName,
  pickPhoto,
  pickStyle,
  pickUrl,
  pickWikidataUrl,
  pickWikipediaUrl,
  PropertyVariant,
} from "../../shared/mixing";
import { getTerritoryAddressHandlingConfig } from "../../shared/territory";

interface VariantInfoInstance {
  variant: PropertyVariant;
  parentFeature: MixedOutputLayersFeature;
}
interface VariantInfo {
  instances: [VariantInfoInstance, ...VariantInfoInstance[]];
  parsedDataToOmitSelectors?: DataToOmitSelector[];
}

// Placeholder properties are added to the first feature of the resulting feature collection.
// This ensures property list completeness and order in apps like QGIS.
const placeholderProperties: Record<keyof MixedPropertyVariants, null> = {
  address: null,
  addressSource: null,
  architect: null,
  architectSource: null,
  buildingType: null,
  buildingTypeSource: null,
  completionTime: null,
  completionTimeSource: null,
  derivedBeautifiedAddress: null,
  derivedBeautifiedName: null,
  derivedCompletionTimeForGeosemantica: null,
  derivedCompletionYear: null,
  floorCountAboveGround: null,
  floorCountBelowGround: null,
  floorCountSource: null,
  geometryId: null,
  geometrySource: null,
  mkrfUrl: null,
  mkrfUrlSource: null,
  name: null,
  nameSource: null,
  photoAuthorName: null,
  photoAuthorUrl: null,
  photoSource: null,
  photoUrl: null,
  style: null,
  styleSource: null,
  url: null,
  urlSource: null,
  wikidataUrl: null,
  wikidataUrlSource: null,
  wikipediaUrl: null,
  wikipediaUrlSource: null,
};

const command: Command = async ({ logger }) => {
  logger.log(chalk.bold("Mixing property variants"));

  process.stdout.write(chalk.green("Loading mixed output layers..."));
  const inputFileName = getMixedOutputLayersFilePath();
  const inputFeatureCollection = (await fs.readJson(
    inputFileName,
  )) as MixedOutputLayersFeatureCollection;

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Indexing property variants..."));

  const variantInfoLookup: Record<string, VariantInfo> = {};
  const dataToOmitIssues: string[] = [];

  for (const inputFeature of inputFeatureCollection.features) {
    const propertyVariants = inputFeature.properties.variants;
    for (const propertyVariant of propertyVariants) {
      const globalVariantId = buildGlobalFeatureOrVariantId(
        propertyVariant.source,
        propertyVariant.id,
      );

      const variantInfoInstance: VariantInfoInstance = {
        variant: propertyVariant,
        parentFeature: inputFeature,
      };

      if ("dataToIgnore" in propertyVariant) {
        dataToOmitIssues.push(
          `Property ‘dataToIgnore’ in feature ${globalVariantId} won’t be used. Did you mean ‘dataToOmit’?`,
        );
      }

      let variantInfo = variantInfoLookup[globalVariantId];
      if (!variantInfo) {
        variantInfo = {
          instances: [variantInfoInstance],
          parsedDataToOmitSelectors: parseDataToOmit(
            propertyVariant.dataToOmit ?? undefined,
            (issue) => dataToOmitIssues.push(issue),
          ),
        };
        variantInfoLookup[globalVariantId] = variantInfo;
      } else {
        variantInfo.instances.push(variantInfoInstance);
      }
    }
  }

  // Check for mismatching variants
  const variantIdsWithMismatchedValues: string[] = [];
  for (const [variantId, variantInfo] of Object.entries(variantInfoLookup)) {
    const modelInstance = variantInfo.instances[0];
    const modelVariantToCompareWith = _.omit(modelInstance.variant, "distance");
    for (const instance of variantInfo.instances) {
      if (instance === modelInstance) {
        continue;
      }
      if (
        !_.isEqual(
          _.omit(instance.variant, "distance"),
          modelVariantToCompareWith,
        )
      ) {
        variantIdsWithMismatchedValues.push(variantId);
        break;
      }
    }
  }

  process.stdout.write(` Done.\n`);

  dataToOmitIssues.forEach((issue) => logger.log(chalk.yellow(issue)));

  if (variantIdsWithMismatchedValues.length) {
    logger.log(
      chalk.red(
        `\nSome property variants do not equal to themselves. Looks like you’ve edited the data that was generated by the previous command. Please re-run it.\n  ${variantIdsWithMismatchedValues
          .slice(0, 10)
          .join("\n  ")}`,
      ),
    );
  }

  process.stdout.write(chalk.green("Finding geometry to omit..."));
  const inputFeaturesToOmit = new Set<MixedOutputLayersFeature>();

  for (const variantInfo of Object.values(variantInfoLookup)) {
    if (!variantInfo.parsedDataToOmitSelectors) {
      continue;
    }
    for (const { parentFeature } of variantInfo.instances) {
      if (
        matchDataToOmitSelectors(
          variantInfo.parsedDataToOmitSelectors,
          parentFeature.properties.geometrySource,
          parentFeature.properties.geometryId,
        )
      ) {
        inputFeaturesToOmit.add(parentFeature);
      }
    }
  }

  process.stdout.write(` Features omitted: ${inputFeaturesToOmit.size}.\n`);

  process.stdout.write(
    chalk.green("Assigning property variants to features..."),
  );

  const inputFeatureByPropertyVariant: Record<
    string,
    MixedOutputLayersFeature
  > = {};
  for (const [variantId, variantInfo] of Object.entries(variantInfoLookup)) {
    const instancesWithoutOmittedFeatures = variantInfo.instances.filter(
      (instance) => !inputFeaturesToOmit.has(instance.parentFeature),
    );

    const instancesOrderedByDistance = _.orderBy(
      instancesWithoutOmittedFeatures,
      (instance) => instance.variant.distance,
    );

    if (instancesOrderedByDistance[0]) {
      inputFeatureByPropertyVariant[variantId] =
        instancesOrderedByDistance[0].parentFeature;
    }
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Mixing property variants..."));

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(logger);

  const outputFeatures: MixedPropertyVariantsFeature[] = [];
  for (const inputFeature of inputFeatureCollection.features) {
    if (inputFeaturesToOmit.has(inputFeature)) {
      continue;
    }

    const allPropertyVariants = inputFeature.properties.variants;
    const propertyVariants: PropertyVariant[] = [];
    const dataToOmitSelectors: DataToOmitSelector[] = [];

    allPropertyVariants.forEach((propertyVariant) => {
      const globalVariantId = buildGlobalFeatureOrVariantId(
        propertyVariant.source,
        propertyVariant.id,
      );

      if (inputFeatureByPropertyVariant[globalVariantId] !== inputFeature) {
        return;
      }

      propertyVariants.push(propertyVariant);

      const variantInfo = variantInfoLookup[globalVariantId];
      if (!variantInfo) {
        throw new Error("Unexpected empty variantInfo. This is a bug.");
      }

      if (variantInfo.parsedDataToOmitSelectors) {
        dataToOmitSelectors.push(...variantInfo.parsedDataToOmitSelectors);
      }
    });

    const listRelevantPropertyVariants: ListRelevantPropertyVariants = (
      propertySelectors,
    ) =>
      propertyVariants.filter((propertyVariant) => {
        const propertyNames = Object.keys(propertyVariant);

        return (
          !matchDataToOmitSelectors(
            dataToOmitSelectors,
            propertyVariant.source,
            propertyVariant.id,
            propertySelectors,
          ) &&
          propertyNames.some((propertyName) =>
            propertySelectors.some((propertyNameThatShouldNotBeOmitted) =>
              propertyName.startsWith(propertyNameThatShouldNotBeOmitted),
            ),
          )
        );
      });

    const payloadForPick = {
      listRelevantPropertyVariants,
      logger,
      targetBuildArea: turf.area(inputFeature),
    };

    const mixedPropertyVariants: MixedPropertyVariants = deepClean({
      geometryId: inputFeature.properties.geometryId,
      geometrySource: inputFeature.properties.geometrySource,
      ...pickAddress({ ...payloadForPick, addressHandlingConfig }),
      ...pickArchitect(payloadForPick),
      ...pickCompletionTime(payloadForPick),
      ...pickFloorCount(payloadForPick),
      ...pickMkrfUrl(payloadForPick),
      ...pickName(payloadForPick),
      ...pickPhoto(payloadForPick),
      ...pickStyle(payloadForPick),
      ...pickUrl(payloadForPick),
      ...pickWikidataUrl(payloadForPick),
      ...pickWikipediaUrl(payloadForPick),
    });

    outputFeatures.push(
      turf.feature(
        inputFeature.geometry,
        sortKeys(
          outputFeatures.length === 0
            ? { ...placeholderProperties, ...mixedPropertyVariants }
            : mixedPropertyVariants,
        ),
      ),
    );
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green(`Beautifying picked addresses...`));

  const knownAddresses: string[] = [];
  for (const outputFeature of outputFeatures) {
    const address = outputFeature.properties.address;
    if (address) {
      knownAddresses.push(address);
    }
  }

  const beautifyAddress = createBeautifyAddress(
    knownAddresses,
    addressHandlingConfig,
  );

  for (const outputFeature of outputFeatures) {
    const address = outputFeature.properties.address;
    if (address) {
      outputFeature.properties.derivedBeautifiedAddress =
        beautifyAddress(address);
      outputFeature.properties = sortKeys(outputFeature.properties);
    }
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green(`Saving...`));

  await ensureTerritoryGitignoreContainsMixing();

  const resultFileName = getMixedPropertyVariantsFilePath();
  const outputFeatureCollection = turf.featureCollection(outputFeatures);
  await writeFormattedJson(resultFileName, outputFeatureCollection);

  logger.log(` Result saved to ${chalk.magenta(resultFileName)}`);
};

autoStartCommandIfNeeded(command, __filename);

export default command;
