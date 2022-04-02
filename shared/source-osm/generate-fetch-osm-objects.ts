import * as turf from "@turf/turf";
import chalk from "chalk";
import dedent from "dedent";
import { WriteStream } from "node:tty";

import { writeFormattedJson } from "../helpers-for-json";
import { getTerritoryExtent } from "../territory";
import { fetchGeojsonFromOverpassApi } from "./fetch-geo-json-from-overpass-api";

export const generateFetchOsmObjects =
  ({
    acceptedGeometryTypes,
    filePath,
    getExtent = () => getTerritoryExtent(),
    output,
    needToTryAnotherExtentVersion,
    selectors,
    title,
  }: {
    acceptedGeometryTypes: turf.GeometryTypes[];
    filePath: string;
    getExtent?: (extentVersion: number) => Promise<turf.Feature<turf.Polygon>>;
    output: WriteStream;
    needToTryAnotherExtentVersion?: (
      geojsonData: turf.FeatureCollection<turf.GeometryObject>,
    ) => boolean;
    selectors: string[];
    title: string;
  }) =>
  async () => {
    output.write(chalk.bold(`sources/osm: Fetching ${title}\n`));

    const query = dedent`
      [out:json][timeout:60];
      (${selectors
        .map((selector) => `\n      ${selector}({{extent}});`)
        .join("")}
      );
      out body;
      >;
      out skel qt;
    `;

    output.write(
      `\n${
        chalk.bold(chalk.cyan("Overpass API query")) //
      }\n\n${
        chalk.cyan(query) //
      }\n\n`,
    );

    for (let extentVersion = 0; ; extentVersion += 1) {
      const geojsonData = await fetchGeojsonFromOverpassApi({
        output,
        acceptedGeometryTypes,
        query,
        extent: await getExtent(extentVersion),
      });

      if (needToTryAnotherExtentVersion?.(geojsonData)) {
        output.write("Need to try another extent version.\n");
        continue;
      }

      output.write(chalk.green("Saving..."));
      await writeFormattedJson(filePath, geojsonData);
      break;
    }

    output.write(` Done: ${chalk.magenta(filePath)}\n`);
  };
