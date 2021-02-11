import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sortKeys from "sort-keys";

import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  getHouseFilePath,
  getMingkhDirPath,
  HouseInfoFile,
  loopThroughHouseLists,
  loopThroughRowsInHouseList,
} from "../../../shared/sources/mingkh";

export const previewHouseInfos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Previewing house infos as geojson"));

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

  const previewHouseInfosFilePath = path.resolve(
    getMingkhDirPath(),
    "preview--house-infos.geojson",
  );
  await writeFormattedJson(previewHouseInfosFilePath, featureCollection);

  process.stdout.write(
    ` Result saved to ${chalk.magenta(previewHouseInfosFilePath)}\n`,
  );
};

autoStartCommandIfNeeded(previewHouseInfos, __filename);
