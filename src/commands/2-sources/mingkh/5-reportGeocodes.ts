import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import { ReportedGeocode, reportGeocodes } from "../../../shared/geocoding";
import {
  getHouseFilePath,
  HouseInfoFile,
  loopThroughHouseLists,
  loopThroughRowsInHouseList,
  normalizeMingkhAddress,
} from "../../../shared/sources/mingkh";

export const combineHouseInfosIntoGeoJson: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Combining house infos into GeoJson"));

  const features: turf.Feature[] = [];

  await loopThroughHouseLists(async ({ houseListFilePath }) => {
    await loopThroughRowsInHouseList(houseListFilePath, async ({ houseId }) => {
      const houseInfoFilePath = getHouseFilePath(houseId, "info.json");

      process.stdout.write(` Reading...`);

      const infoFile = (await fs.readJson(houseInfoFilePath)) as HouseInfoFile;

      const {
        data: { centerPoint, id, ...params },
        ...metaParams
      } = infoFile;

      if (!centerPoint) {
        process.stdout.write(
          chalk.gray(` Skipping because centerPoint is missing\n`),
        );

        return;
      }

      const normalizedAddress = params.address
        ? normalizeMingkhAddress(params.address)
        : undefined;

      const feature = turf.point(
        centerPoint,
        sortKeys({
          ...params,
          ...metaParams,
          normalizedAddress,
        }),
        { id },
      );

      features.push(feature);
      process.stdout.write(` Done.\n`);
    });
  });

  const featureCollection = turf.featureCollection(
    _.orderBy(features, (feature) => feature.id),
  );

  const reportedGeocodes: ReportedGeocode[] = [];
  for (const feature of featureCollection.features) {
    const coordinates = feature.geometry.coordinates;
    const { normalizedAddress, fetchedAt } = feature.properties ?? {};
    if (normalizedAddress) {
      reportedGeocodes.push({
        normalizedAddress,
        coordinates,
        knownAt: fetchedAt,
      });
    }
  }

  await reportGeocodes({ source: "mingkh", reportedGeocodes, logger });

  // const houseListGeoJsonFilePath = getHouseListGeoJsonFilePath();
  // await writeFormattedJson(houseListGeoJsonFilePath, featureCollection);

  // process.stdout.write(
  //   ` Result saved to ${chalk.magenta(houseListGeoJsonFilePath)}\n`,
  // );
};

autoStartCommandIfNeeded(combineHouseInfosIntoGeoJson, __filename);
