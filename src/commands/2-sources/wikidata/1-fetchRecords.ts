import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import axios from "axios";
import chalk from "chalk";
import dedent from "dedent";

import { roughenBbox } from "../../../shared/helpersForGeometry";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import {
  getWikidataFetchedRecordsFilePath,
  parseCoordinateLocation,
  WikidataApiResponse,
  WikidataRecordsFileContent,
} from "../../../shared/sources/wikidata";
import { getTerritoryExtent } from "../../../shared/territory";

export const fetchRecords: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/wikidata: Fetch records (execute query)"));

  process.stdout.write(chalk.green("Preparing to make the API query..."));

  const territoryExtent = await getTerritoryExtent();
  const roughBbox = roughenBbox(turf.bbox(territoryExtent), 3);

  const query = dedent`
      SELECT ?architectLabel ?architecturalStyleLabel ?article ?coordinateLocation ?image ?item  ?itemLabel
       WHERE {
        ?item wdt:P31/wdt:P279* wd:Q41176 . # building
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
        SERVICE wikibase:box {
          ?item wdt:P625 ?location.
          bd:serviceParam wikibase:cornerSouthWest "Point(${roughBbox[0]} ${roughBbox[1]})"^^geo:wktLiteral;
            wikibase:cornerNorthEast "Point(${roughBbox[2]} ${roughBbox[3]})"^^geo:wktLiteral.
        }
        OPTIONAL { ?item wdt:P84 ?architect. }
        OPTIONAL { ?item wdt:P149 ?architecturalStyle. }
        OPTIONAL { ?item wdt:P625 ?coordinateLocation. }
        OPTIONAL { ?item wdt:P18 ?image. }
        OPTIONAL {
          ?article schema:about ?item;
            schema:inLanguage "ru".
        }
      }
    `;

  process.stdout.write(" Done.\n");

  process.stdout.write(chalk.green("Calling Wikidata API..."));

  const rawJsonData: WikidataApiResponse = (
    await axios.get("https://query.wikidata.org/sparql", {
      responseType: "json",
      params: { query },
    })
  ).data;

  process.stdout.write(" Done.\n");
  process.stdout.write(chalk.green("Post-processing..."));

  const fileContent: WikidataRecordsFileContent = {
    fetchedAt: serializeTime(),
    // Scan through objects, parse location and filter items outside region extent
    records: rawJsonData.results.bindings.filter((item) => {
      const point = parseCoordinateLocation(item.coordinateLocation.value);

      return turf.booleanPointInPolygon(point, territoryExtent);
    }),
  };

  process.stdout.write(" Done.\n");
  process.stdout.write(chalk.green("Saving..."));

  const filePath = getWikidataFetchedRecordsFilePath();
  await writeFormattedJson(filePath, fileContent);

  process.stdout.write(` Done: ${chalk.magenta(filePath)}\n`);
};

autoStartCommandIfNeeded(fetchRecords, __filename);
