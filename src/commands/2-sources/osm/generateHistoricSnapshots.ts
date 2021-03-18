import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sharp from "sharp";
import * as vega from "vega";
import * as vegaLite from "vega-lite";

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

type VegaEntry = [date: string, count: number, category: string];
// category: "withAddress" | "withoutRequiredAddress" | "withoutOptionalAddress";

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

const generateVegaSpec = (
  summaries: HistoricSnapshotSummaryForOsm[],
): vegaLite.TopLevelSpec => {
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
      [
        summary.knownAt,
        summary.numberOfBuildingsWithAddresses,
        "адрес есть", //
      ],
      [
        summary.knownAt,
        summary.numberOfBuildingsWithoutRequiredAddresses,
        "адреса не хватает",
      ],
      [
        summary.knownAt,
        summary.numberOfBuildingsWithoutOptionalAddresses,
        "адрес необязателен",
      ],
    );
  });

  vegaEntries = _.orderBy(vegaEntries);

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: (5 * 7 + 4) * 20,
    height: 30 * 20,
    padding: 25,
    config: {
      axis: {
        labelFont: "Helvetica",
        titleFont: "Helvetica",
        labelFontSize: 18,
        titleFontSize: 18,
      },
      legend: {
        labelFont: "Helvetica",
        titleFont: "Helvetica",
        labelFontSize: 18,
        titleFontSize: 18,
        titleLineHeight: 22,
        clipHeight: 22,
      },
      mark: { font: "Helvetica" },
      text: { font: "Helvetica", fontSize: 18, lineHeight: 22 },
      title: {
        font: "Helvetica",
        fontSize: 32,
        fontWeight: "normal",
        subtitleFont: "Helvetica",
        subtitleFontSize: 18,
      },
    },
    data: {
      values: vegaEntries,
    },
    layer: [
      {
        mark: {
          type: "line",
          interpolate: "linear",
          tooltip: { content: "data" },
          strokeCap: "round",
          strokeJoin: "round",
        },
        transform: [
          {
            timeUnit: "utcyearmonthdatehoursminutesseconds",
            field: "0",
            as: "3",
          },
          {
            calculate: "timeOffset('hours', datum[0], 3)", // UTC+3
            as: "4",
          },
        ],
        encoding: {
          strokeWidth: { value: 3 },
          x: {
            timeUnit: "utcyearmonthdatehoursminutesseconds",
            field: "4",
            scale: {
              domain: ["2021-02-20T00:00:00Z", "2021-03-31T00:00:00Z"],
              clamp: true,
            },
            axis: {
              tickCount: "day",
              tickSize: {
                condition: { test: "day(datum.value) !== 1", value: 0 },
                value: 5,
              },
              labelPadding: 4,
              labelExpr:
                "day(datum.value) === 1 ? timeFormat(datum.value, '%d.%m') : ''",
              labelAlign: "left",
              gridDash: {
                condition: { test: "day(datum.value) === 1", value: [0, 0] },
                value: [1, 3],
              },
              gridDashOffset: 0.5,
              titlePadding: 15,
            },
            title: "февраль–март 2021 года, часовой пояс MSK (UTC+3)",
          },
          y: {
            aggregate: "sum",
            field: "1",
            scale: { domainMax: 30000 },
            axis: {
              tickSize: {
                condition: { test: "datum.value % 5000", value: 0 },
                value: 5,
              },
              tickCount: 30,
              tickMinStep: 1000,
              title: " ",
              titlePadding: 10,
              labelExpr:
                "datum.value % 5000 ? '' : datum.value === 0 ? '0' : round(datum.value / 1000) + 'К' ",
              gridDash: {
                condition: { test: "datum.value % 5000", value: [1, 3] },
                value: [0, 0],
              },
              gridDashOffset: 0.5,
            },
          },
          color: {
            field: "2",
            legend: {
              orient: "none",
              legendX: -300,
              legendY: -8,
              labelLimit: 200,
              titleLimit: 200,
              title: "количество зданий",
              values: ["адрес есть", "адреса не хватает", "адрес необязателен"],
              symbolStrokeWidth: 3,
            },
            scale: {
              domain: ["адрес есть", "адрес необязателен", "адреса не хватает"],
              range: ["#6be0a6", "#a4a4a4", "#c82677"],
            },
          },
        },
      },
      {
        mark: {
          type: "text",
          align: "left",
          baseline: "top",
          text: [
            "В первую категорию",
            "попадают здания,",
            "у которых указаны",
            "и улица, и номер дома.",
            "⁠",
            "",
            "Адрес условно считается",
            "необязательным у зданий",
            "с тегом building =",
            ...[...optionalBuildingTypesSet]
              .sort()
              .map((v) => `\u2060 \u2060 \u2060 ${v}`),
            "⁠",
            "",
            "Этот список дополняем.",
            "",
          ],
        },
        data: { values: [0] },
        encoding: {
          x: { value: -300 },
          y: { value: 105 },
        },
      },
    ],
    title: {
      text: "Домашняя картовечеринка в Пензе, Заречном и Спутнике",
      align: "left",
      anchor: "start",
      subtitle: "wiki.osm.org/wiki/RU:Пенза/встречи, t.me/osm_pnz",
      offset: 30,
    },
  };
};

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

    const commitDirPath = path.resolve(
      historicSnapshotsDirPath,
      "commits",
      commit,
    );

    await fs.ensureDir(commitDirPath);

    const summaryFilePath = path.resolve(commitDirPath, "summary.json");
    let summary: HistoricSnapshotSummaryForOsm | undefined = undefined;

    if (!(await fs.pathExists(summaryFilePath))) {
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
        await fs.remove(fetchedOsmBuildingsFilePath);
        await fs.remove(outputLayerFilePath);
      }
    }

    if (!summary) {
      summary = await fs.readJson(summaryFilePath);
    }
    summaries.push(summary!);
  }

  const vegaLiteSpec = generateVegaSpec(summaries);

  const vegaLiteSpecFilePath = path.resolve(
    historicSnapshotsDirPath,
    "counts-over-time.vl.json",
  );

  await writeFormattedJson(vegaLiteSpecFilePath, vegaLiteSpec);
  logger.log(chalk.magenta(vegaLiteSpecFilePath));

  const svgImageFilePath = path.resolve(
    historicSnapshotsDirPath,
    "counts-over-time.svg",
  );

  const pngImageFilePath = path.resolve(
    historicSnapshotsDirPath,
    "counts-over-time.png",
  );

  const view = new vega.View(vega.parse(vegaLite.compile(vegaLiteSpec).spec), {
    renderer: "none",
  });
  const svg = await view.toSVG(2);

  await fs.writeFile(svgImageFilePath, svg, "utf8");
  logger.log(chalk.magenta(svgImageFilePath));

  await sharp(Buffer.from(svg), { density: 96 })
    .toFormat("png")
    .toFile(pngImageFilePath);
  logger.log(chalk.magenta(pngImageFilePath));
};

autoStartCommandIfNeeded(generateHistoricSnapshots, __filename);
