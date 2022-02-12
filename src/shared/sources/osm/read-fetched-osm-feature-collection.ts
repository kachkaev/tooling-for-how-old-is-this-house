import fs from "fs-extra";

import { ScriptError } from "../../helpers-for-scripts";
import {
  getFetchedOsmBoundariesForRegionsFilePath,
  getFetchedOsmBoundariesForSettlementsFilePath,
  getFetchedOsmBuildingsFilePath,
  getFetchedOsmRailwaysFilePath,
  getFetchedOsmRoadsFilePath,
  getFetchedOsmWaterObjectsFilePath,
} from "./helpers-for-paths";
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

export const readFetchedOsmFeatureCollection: // https://github.com/prettier/prettier/issues/11923
ReadFetchedOsmFeatureCollection = async (collectionName: string) => {
  const filePath = resolveCollectionNameToFilePath(collectionName);
  let result: OsmFeatureCollection<any> | undefined;
  try {
    result = (await fs.readJson(filePath)) as OsmFeatureCollection;
  } catch {
    // noop
  }

  if (
    !result &&
    (collectionName === "buildings" ||
      collectionName === "boundaries-for-regions" ||
      collectionName === "boundaries-for-settlements")
  ) {
    throw new ScriptError(
      `Please generate ${filePath} by running a corresponding script.`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- tolerable due to type overloading
  return result as any;
};
