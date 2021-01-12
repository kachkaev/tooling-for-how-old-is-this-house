import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import {
  deriveHouseFilePath,
  getHouseListGeoJsonFilePath,
  HouseInfoFile,
  loopThroughHouseLists,
  loopThroughRowsInHouseList,
} from "../../../shared/sources/mingkh";

export const combineHouseInfosIntoGeoJson: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Combining house infos into GeoJson"));

  const features: turf.Feature[] = [];

  await loopThroughHouseLists(async ({ houseListFilePath }) => {
    await loopThroughRowsInHouseList(houseListFilePath, async ({ houseId }) => {
      const houseInfoFilePath = deriveHouseFilePath(houseId, "info.json");

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

      const feature = turf.point(
        centerPoint,
        sortKeys({
          ...params,
          ...metaParams,
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

  const houseListGeoJsonFilePath = getHouseListGeoJsonFilePath();
  await fs.writeJson(houseListGeoJsonFilePath, featureCollection, {
    spaces: 2,
  });

  process.stdout.write(
    ` Result saved to ${chalk.magenta(houseListGeoJsonFilePath)}\n`,
  );
};

autoStartCommandIfNeeded(combineHouseInfosIntoGeoJson, __filename);
