import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import {
  loopThroughHouseLists,
  loopThroughRowsInHouseList,
} from "./helpersForLists";
import { getHouseFilePath } from "./helpersForPaths";
import { HouseInfo, HouseInfoFile } from "./types";

type FeatureProperties = Omit<HouseInfo, "centerPoint"> & { fetchedAt: string };

export const generateMingkhHouseInfoCollection = async (): Promise<
  turf.FeatureCollection<turf.Point | undefined, FeatureProperties>
> => {
  const features: Array<turf.Feature<turf.Point, FeatureProperties>> = [];

  await loopThroughHouseLists(async ({ houseListFilePath }) => {
    await loopThroughRowsInHouseList(houseListFilePath, async ({ houseId }) => {
      const houseInfoFilePath = getHouseFilePath(houseId, "info.json");

      process.stdout.write(` Reading...`);

      const infoFile = (await fs.readJson(houseInfoFilePath)) as HouseInfoFile;

      const {
        data: { centerPoint, ...params },
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
          fetchedAt: infoFile.fetchedAt,
        }),
      );

      features.push(feature);
      process.stdout.write(` Done.\n`);
    });
  });

  const houseInfoCollection = turf.featureCollection(
    _.orderBy(features, (feature) => feature.id),
  );

  return houseInfoCollection;
};
