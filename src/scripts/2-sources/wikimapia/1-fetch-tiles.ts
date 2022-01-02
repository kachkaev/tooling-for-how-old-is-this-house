import * as tilebelt from "@mapbox/tilebelt";
import { kml } from "@tmcw/togeojson";
import * as turf from "@turf/turf";
import { DOMParser } from "@xmldom/xmldom";
import axios from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import fs from "fs-extra";
import sortKeys from "sort-keys";

import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import {
  generateWikimapiaTileComment,
  getRecommendedWikimapiaTileZoom,
  getWikimapiaTileDataFilePath,
  ProcessedWikimapiaTileResponse,
  WikimapiaTileData,
} from "../../../shared/sources/wikimapia";
import { getTerritoryExtent } from "../../../shared/territory";
import { processTiles } from "../../../shared/tiles";

const output = process.stdout;

axiosRetry(axios);

const featurePropertiesToExclude = [
  "icon",
  "icon-scale",
  "label-scale",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "styleHash",
  "styleMapHash",
  "styleUrl",
];

const processWikimapiaTileResponse = (
  rawTileResponse: string,
): ProcessedWikimapiaTileResponse => {
  const tileResponseAsKml = new DOMParser().parseFromString(rawTileResponse);
  const featureCollection = kml(tileResponseAsKml, {
    styles: false,
  }) as turf.FeatureCollection<turf.GeometryCollection>;

  const cleanedFeatures = featureCollection.features.map((feature) => {
    const cleanedGeometries = feature.geometry.geometries.map<
      turf.LineString | turf.Point
    >((geometry) => {
      if (geometry.type === "Point") {
        return {
          type: "Point",
          coordinates: geometry.coordinates.slice(0, 2), // remove z coordinate
        };
      } else if (geometry.type === "LineString") {
        return {
          type: "LineString",
          coordinates: geometry.coordinates.map((point) => point.slice(0, 2)), // remove z coordinate
        };
      } else {
        throw new Error(`Unexpected geometry type ${geometry.type}}`);
      }
    });

    const cleanedProperties = Object.fromEntries(
      Object.entries(feature.properties ?? {})
        .filter(([key]) => !featurePropertiesToExclude.includes(key))
        .map(([key, value]) => {
          if (key === "description" && typeof value === "string") {
            return [key, value.trim()];
          }

          return [key, value];
        }),
    );

    return turf.feature(
      turf.geometryCollection(cleanedGeometries).geometry,
      sortKeys(cleanedProperties),
      feature.id ? { id: feature.id } : {},
    );
  });

  return cleanedFeatures;
};

const script = async () => {
  output.write(chalk.bold("sources/wikimapia: Fetching tiles"));

  const recommendedTileZoom = getRecommendedWikimapiaTileZoom();
  await processTiles({
    initialZoom: recommendedTileZoom,
    maxAllowedZoom: recommendedTileZoom,
    territoryExtent: await getTerritoryExtent(),
    processTile: async (tile) => {
      const tileDataFilePath = getWikimapiaTileDataFilePath(tile);

      try {
        const cachedTileData = (await fs.readJson(
          tileDataFilePath,
        )) as WikimapiaTileData;

        return {
          cacheStatus: "used",
          tileStatus: "complete",
          comment: generateWikimapiaTileComment(
            tileDataFilePath,
            cachedTileData,
          ),
        };
      } catch {
        // noop – proceeding with actual fetching
      }

      const tileBbox = tilebelt.tileToBBOX(tile) as turf.BBox;

      const rawTileResponse = (
        await axios.get<string>("https://wikimapia.org/d", {
          params: {
            BBOX: tileBbox.join(","),
          },
          timeout: 20000,
          headers: {
            "Accept-Encoding": "gzip, deflate",
          },
          "axios-retry": {
            retries: 3,
            shouldResetTimeout: true,
          },
        })
      ).data;

      const processedTileResponse =
        processWikimapiaTileResponse(rawTileResponse);

      const tileData: WikimapiaTileData = {
        tile,
        fetchedAt: serializeTime(),
        response: processedTileResponse,
      };

      await writeFormattedJson(tileDataFilePath, tileData);

      return {
        cacheStatus: "notUsed",
        tileStatus: "complete",
        comment: generateWikimapiaTileComment(tileDataFilePath, tileData),
      };
    },
    output,
  });
};

await script();
