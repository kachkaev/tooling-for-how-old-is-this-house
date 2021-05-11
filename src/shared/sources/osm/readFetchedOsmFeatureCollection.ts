import fs from "fs-extra";
import path from "path";

import {
  getFetchedOsmBoundariesForRegionsFilePath,
  getFetchedOsmBoundariesForSettlementsFilePath,
  getFetchedOsmBuildingsFilePath,
  getFetchedOsmRailwaysFilePath,
  getFetchedOsmRoadsFilePath,
  getFetchedOsmWaterObjectsFilePath,
} from "./helpersForPaths";
import {
  OsmFeatureCollection,
  OsmRailwayGeometry,
  OsmRoadGeometry,
  OsmWaterObjectGeometry,
} from "./types";

interface ReadFetchedOsmFeatureCollection {
  (
    collectionName:
      | "buildings"
      | "boundaries-for-regions"
      | "boundaries-for-settlements",
  ): Promise<OsmFeatureCollection>;

  (collectionName: "railways"): Promise<
    OsmFeatureCollection<OsmRailwayGeometry> | undefined
  >;

  (collectionName: "roads"):
    | Promise<OsmFeatureCollection<OsmRoadGeometry>>
    | undefined;

  (collectionName: "water-objects"): Promise<
    OsmFeatureCollection<OsmWaterObjectGeometry> | undefined
  >;
}

const resolveCollectionNameToFilePath = (collectionName: string) => {
  switch (collectionName) {
    case "buildings":
      return getFetchedOsmBuildingsFilePath();
    case "boundaries-for-regions":
      return getFetchedOsmBoundariesForRegionsFilePath();
    case "boundaries-for-settlements":
      return getFetchedOsmBoundariesForSettlementsFilePath();
    case "roads":
      return getFetchedOsmRoadsFilePath();
    case "railways":
      return getFetchedOsmRailwaysFilePath();
    case "water-objects":
      return getFetchedOsmWaterObjectsFilePath();
  }
  throw new Error(`Unexpected OSM feature collection name ${collectionName}`);
};

export const readFetchedOsmFeatureCollection: ReadFetchedOsmFeatureCollection = async (
  collectionName: string,
) => {
  const filePath = resolveCollectionNameToFilePath(collectionName);
  let result: OsmFeatureCollection<any> | undefined = undefined;
  try {
    result = await fs.readJson(filePath);
  } catch {
    // noop
  }

  if (
    !result &&
    (collectionName === "buildings" ||
      collectionName === "boundaries-for-regions" ||
      collectionName === "boundaries-for-settlements")
  ) {
    throw new Error(
      `Please generate ${filePath} by running a corresponding command.`,
    );
  }

  const fetchedAt = result?.fetchedAt;

  if (result && (!fetchedAt || fetchedAt < "2021-05-11T09:00:00Z")) {
    throw new Error(
      `Data in ${path.dirname(
        filePath,
      )} is out of sync with the latest tooling. Please delete this folder and re-run all commands for OSM source.`,
    );
  }

  return result as any;
};
