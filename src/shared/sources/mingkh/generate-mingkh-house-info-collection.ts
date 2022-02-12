import * as turf from "@turf/turf";
import fs from "fs-extra";
import _ from "lodash";
import { WriteStream } from "node:tty";
import sortKeys from "sort-keys";

import { processFiles } from "../../process-files";
import { getMingkhHousesDirPath } from "./helpers-for-paths";
import { HouseInfo, HouseInfoFile } from "./types";

type FeatureProperties = Omit<HouseInfo, "centerPoint"> & { fetchedAt: string };

export const generateMingkhHouseInfoCollection = async ({
  output,
}: {
  output?: WriteStream | undefined;
}): Promise<
  turf.FeatureCollection<turf.Point | undefined, FeatureProperties>
> => {
  const features: Array<turf.Feature<turf.Point, FeatureProperties>> = [];
  let numberOfSkippedFiles: number = 0;

  await processFiles({
    fileSearchDirPath: getMingkhHousesDirPath(),
    fileSearchPattern: "**/*-info.json",
    filesNicknameToLog: "raw house infos",
    output,
    processFile: async (houseInfoFilePath) => {
      const infoFile = (await fs.readJson(houseInfoFilePath)) as HouseInfoFile;

      const {
        data: { centerPoint, ...params },
        ...metaParams
      } = infoFile;

      if (!centerPoint) {
        numberOfSkippedFiles += 1;

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
    },
    statusReportFrequency: 500,
  });

  output?.write(
    `Done. Number of skipped files because of no center point: ${numberOfSkippedFiles}.\n`,
  );

  const houseInfoCollection = turf.featureCollection(
    _.orderBy(features, (feature) => feature.id),
  );

  return houseInfoCollection;
};
