import * as turf from "@turf/turf";
import axios from "axios";
import chalk from "chalk";
import dedent from "dedent";
import _ from "lodash";
import sortKeys from "sort-keys";

import { roughenBbox } from "../../../shared/helpersForGeometry";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import {
  extractGeometry,
  getWikidataProcessedQueryResultFilePath,
  ProcessedQueryResult,
  WikidataApiResponse,
} from "../../../shared/sources/wikidata";
import { getTerritoryExtent } from "../../../shared/territory";

const output = process.stdout;

const script = async () => {
  output.write(
    chalk.bold("sources/wikidata: Fetching items (executing query)\n"),
  );

  output.write(chalk.green("Preparing to make the API query..."));

  const territoryExtent = await getTerritoryExtent();
  const roughBbox = roughenBbox(turf.bbox(territoryExtent), 3);

  const query = dedent`
    SELECT
      ?item
      ?itemLabel
      (SAMPLE(?architectLabel) as ?architectLabel)
      (SAMPLE(?architecturalStyleLabel) as ?architecturalStyleLabel)
      (SAMPLE(?article) as ?article)
      (SAMPLE(?dateModified) as ?dateModified)
      (SAMPLE(?coordinateLocation) as ?coordinateLocation)
      (SAMPLE(?image) as ?image)
      (SAMPLE(?lastModified) as ?lastModified)
    WHERE {
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "ru" .
        ?item rdfs:label ?itemLabel .
        ?architect rdfs:label ?architectLabel .
        ?architecturalStyle rdfs:label ?architecturalStyleLabel
      }

      SERVICE wikibase:box {
        ?item wdt:P625 ?location .
        bd:serviceParam wikibase:cornerSouthWest "Point(${roughBbox[0]} ${roughBbox[1]})"^^geo:wktLiteral;
          wikibase:cornerNorthEast "Point(${roughBbox[2]} ${roughBbox[3]})"^^geo:wktLiteral.
      }

      ?item wdt:P31/wdt:P279* wd:Q41176 . ## instance of / subclass of building
      ?item schema:dateModified ?dateModified

      OPTIONAL { ?item wdt:P84 ?architect . }
      OPTIONAL { ?item wdt:P149 ?architecturalStyle . }
      OPTIONAL { ?item wdt:P625 ?coordinateLocation . }
      OPTIONAL { ?item wdt:P18 ?image . }
      OPTIONAL { ?article schema:about ?item; schema:inLanguage "ru" . }
    }
    GROUP BY ?item ?itemLabel
  `;

  output.write(" Done.\n");

  output.write(chalk.green("Calling Wikidata API..."));

  const { data: rawJsonData } = await axios.get<WikidataApiResponse>(
    "https://query.wikidata.org/sparql",
    { responseType: "json", params: { query } },
  );

  output.write(" Done.\n");
  output.write(chalk.green("Processing..."));

  const fileContent: ProcessedQueryResult = {
    fetchedAt: serializeTime(),
    // Scan through objects, parse location and filter items outside region extent
    items: _.orderBy(
      rawJsonData.results.bindings.filter((item) =>
        turf.booleanPointInPolygon(extractGeometry(item), territoryExtent),
      ),
      (item) => item.item.value,
    ).map((item) => sortKeys(item)),
  };

  output.write(" Done.\n");
  output.write(chalk.green("Saving..."));

  const filePath = getWikidataProcessedQueryResultFilePath();
  await writeFormattedJson(filePath, fileContent);

  output.write(` Done: ${chalk.magenta(filePath)}\n`);
};

await script();
