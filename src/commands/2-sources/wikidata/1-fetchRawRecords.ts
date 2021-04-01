import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import axios from "axios";
import chalk from "chalk";
import dedent from "dedent";

import { roughenBbox } from "../../../shared/helpersForGeometry";
import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  getWikidataRecordsFilePath,
  WikidataApiResponse,
} from "../../../shared/sources/wikidata";
import { getTerritoryExtent } from "../../../shared/territory";

export const fetchRawRecords: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/wikidata: Fetch raw records (execute query)"));

  process.stdout.write(chalk.green("Preparing to make the API query..."));

  const territoryExtent = await getTerritoryExtent();
  const roughBbox = roughenBbox(turf.bbox(territoryExtent), 3);

  const query = dedent`
      SELECT ?item ?image ?coordinate_location ?itemLabel ?article ?architectLabel  ?architectural_styleLabel WHERE {
        ?item wdt:P31/wdt:P279* wd:Q41176 . # building
        SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
        SERVICE wikibase:box {
          ?item wdt:P625 ?location.
          bd:serviceParam wikibase:cornerSouthWest "Point(${roughBbox[0]} ${roughBbox[1]})"^^geo:wktLiteral;
            wikibase:cornerNorthEast "Point(${roughBbox[2]} ${roughBbox[3]})"^^geo:wktLiteral.
        }
        OPTIONAL { ?item wdt:P84 ?architect. }
        OPTIONAL { ?item wdt:P149 ?architectural_style. }
        OPTIONAL { ?item wdt:P18 ?image. }
        OPTIONAL { ?item wdt:P625 ?coordinate_location. }
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
  // process.stdout.write(chalk.green("Post-processing..."));

  // TODO: Scan through objects, parse location and filter items outside region extent

  // process.stdout.write(" Done.\n");
  process.stdout.write(chalk.green("Saving..."));

  const filePath = getWikidataRecordsFilePath();
  await writeFormattedJson(filePath, rawJsonData);

  process.stdout.write(` Done: ${chalk.magenta(filePath)}\n`);
};

autoStartCommandIfNeeded(fetchRawRecords, __filename);
