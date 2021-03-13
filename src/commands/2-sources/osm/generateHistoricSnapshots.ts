import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import { OutputLayer } from "../../../shared/output";
import { getRegionDirPath } from "../../../shared/region";
import {
  generateOsmOutputLayer,
  getFetchedOsmBuildingsFilePath,
  getOsmDirPath,
} from "../../../shared/sources/osm";

interface HistoricSnapshotSummaryForOsm {
  knownAt: string;
  numberOfBuildingsWithAddresses: number;
  numberOfBuildingsWithoutRequiredAddresses: number;
  numberOfBuildingsWithoutOptionalAddresses: number;
}

interface VegaEntry {
  date: string;
  count: number;
  // category: "withAddress" | "withoutRequiredAddress" | "withoutOptionalAddress";
  category: string;
}

const optionalBuildingTypesSet = new Set([
  "barn",
  "construction",
  "garage",
  "garages",
  "gazebo",
  "grandstand",
  "greenhouse",
  "industrial",
  "service",
  "ruins",
  "shed",
]);

export const generateHistoricSnapshots: Command = async ({ logger }) => {
  const gitRepoDirPath = getRegionDirPath();
  const fetchedOsmBuildingsRelativeFilePath = path.relative(
    gitRepoDirPath,
    getFetchedOsmBuildingsFilePath(),
  );
  const fetchedOsmBuildingsBasename = path.basename(
    fetchedOsmBuildingsRelativeFilePath,
  );

  const historicSnapshotsDirPath = path.resolve(
    getOsmDirPath(),
    "historic-snapshots",
  );

  const outputLayerBasename = "output-layer.json";

  const gitLogResult = await execa(
    "git",
    ["log", "--pretty=oneline", "--", fetchedOsmBuildingsRelativeFilePath],
    { cwd: gitRepoDirPath },
  );
  const commits = gitLogResult.stdout
    .split("\n")
    .map((row) => row.split(" ", 1)[0])
    .filter((row): row is string => !!row);

  const summaries: HistoricSnapshotSummaryForOsm[] = [];

  for (const commit of commits) {
    logger.log(commit);

    const commitDirPath = path.resolve(historicSnapshotsDirPath, commit);

    await fs.ensureDir(commitDirPath);

    // Check out fetched buildings if needed
    const fetchedOsmBuildingsFilePath = path.resolve(
      commitDirPath,
      fetchedOsmBuildingsBasename,
    );
    if (!(await fs.pathExists(fetchedOsmBuildingsFilePath))) {
      const subprocess = execa(
        "git",
        ["show", `${commit}:${fetchedOsmBuildingsRelativeFilePath}`],
        { cwd: gitRepoDirPath },
      );
      subprocess.stdout?.pipe(
        fs.createWriteStream(fetchedOsmBuildingsFilePath),
      );
      await subprocess;
    }

    // Generate output layer if needed
    const outputLayerFilePath = path.resolve(
      commitDirPath,
      outputLayerBasename,
    );
    let outputLayer: OutputLayer | undefined = undefined;

    if (!(await fs.pathExists(outputLayerFilePath))) {
      outputLayer = await generateOsmOutputLayer({
        logger,
        fetchedOsmBuildingsFilePath,
      });
      await writeFormattedJson(outputLayerFilePath, outputLayer);
    }

    // Generate summary if needed
    const summaryFilePath = path.resolve(commitDirPath, "summary.json");
    let summary: HistoricSnapshotSummaryForOsm | undefined = undefined;
    if (!(await fs.pathExists(summaryFilePath))) {
      if (!outputLayer) {
        outputLayer = await fs.readJson(outputLayerFilePath);
      }

      if (!outputLayer) {
        throw new Error("Unexpected empty output layer");
      }

      let numberOfBuildingsWithAddresses = 0;
      let numberOfBuildingsWithoutRequiredAddresses = 0;
      let numberOfBuildingsWithoutOptionalAddresses = 0;

      for (const feature of outputLayer?.features) {
        if (feature.properties.normalizedAddress) {
          numberOfBuildingsWithAddresses += 1;
        } else if (
          feature.properties.buildingType &&
          optionalBuildingTypesSet.has(feature.properties.buildingType)
        ) {
          numberOfBuildingsWithoutOptionalAddresses += 1;
        } else {
          numberOfBuildingsWithoutRequiredAddresses += 1;
        }
      }

      if (!outputLayer?.properties?.knownAt) {
        throw new Error(
          `Unexpected empty knownAt ${JSON.stringify(
            outputLayer?.properties ?? null,
          )}`,
        );
      }
      summary = {
        knownAt: serializeTime(outputLayer?.properties?.knownAt),
        numberOfBuildingsWithAddresses,
        numberOfBuildingsWithoutRequiredAddresses,
        numberOfBuildingsWithoutOptionalAddresses,
      };

      await writeFormattedJson(summaryFilePath, summary);
    }

    if (!summary) {
      summary = await fs.readJson(summaryFilePath);
    }
    summaries.push(summary!);
  }

  let vegaEntries: VegaEntry[] = [];
  summaries.forEach((summary, index) => {
    const prevSummary = summaries[index - 1];
    if (
      prevSummary &&
      serializeTime(prevSummary.knownAt) === serializeTime(summary.knownAt)
    ) {
      return;
    }

    vegaEntries.push(
      {
        date: summary.knownAt,
        count: summary.numberOfBuildingsWithAddresses,
        category: "адрес есть",
        // category: "withAddress",
      },
      {
        date: summary.knownAt,
        count: summary.numberOfBuildingsWithoutRequiredAddresses,
        category: "адреса не хватает",
        // category: "withoutRequiredAddress",
      },
      {
        date: summary.knownAt,
        count: summary.numberOfBuildingsWithoutOptionalAddresses,
        category: "адрес необязателен",
        // category: "withoutOptionalAddress",
      },
    );
  });

  vegaEntries = _.orderBy(vegaEntries);

  const vegaEntriesFilePath = path.resolve(
    historicSnapshotsDirPath,
    "vega-entries.json",
  );

  await writeFormattedJson(vegaEntriesFilePath, vegaEntries);

  logger.log(summaries.length);
};

autoStartCommandIfNeeded(generateHistoricSnapshots, __filename);
