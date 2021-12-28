import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import html from "tagged-template-noop"; // Usage of html`` enables Prettier within strings
import { dynamicImport } from "tsimportlib";

import { cleanEnv } from "../../shared/cleanEnv";
import { geographicContextStyling } from "../../shared/geographicContext";
import { extractLegendEntries, extractPosterConfig } from "../../shared/poster";
import {
  ensureTerritoryGitignoreContainsResults,
  generateVersionSuffix,
  getResultsDirPath,
} from "../../shared/results";
import {
  getTerritoryConfig,
  getTerritoryExtent,
  getTerritoryId,
} from "../../shared/territory";

// We can show year labels when the map is zoomed in. Example:
// https://twitter.com/kachkaev_ru/status/1427919578525577217/photo/2
// This is currently disabled to avoid the usage of Arial font in the project.
// The option can be set to true before map publishing for debugging.
const yearLabelsWhenZoomedIn = false;

type FormatColor = (color: string) => string;

const generateSld = ({ rules }: { rules: string | string[] }) =>
  formatSld(html`
    <StyledLayerDescriptor
      xmlns="http://www.opengis.net/sld"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      xmlns:ogc="http://www.opengis.net/ogc"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xmlns:se="http://www.opengis.net/se"
      xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd"
      version="1.1.0"
    >
      <NamedLayer>
        <UserStyle>
          <se:FeatureTypeStyle>
            ${[rules].flat().join(" ")}
          </se:FeatureTypeStyle>
        </UserStyle>
      </NamedLayer>
    </StyledLayerDescriptor>
  `);

const generateBaseBuildingRules = ({
  filter = "",
  formatColor,
}: {
  filter?: string;
  formatColor: FormatColor;
}) => [
  html`
    <se:Rule>
      ${filter}
      <se:PolygonSymbolizer>
        <Fill>
          <se:SvgParameter name="fill"
            >${formatColor(
              geographicContextStyling.buildingColor,
            )}</se:SvgParameter
          >
        </Fill>
        <Stroke>
          <se:SvgParameter name="stroke"
            >${formatColor(
              geographicContextStyling.buildingColor,
            )}</se:SvgParameter
          >
          <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
          <se:SvgParameter name="stroke-width">0.25</se:SvgParameter>
        </Stroke>
      </se:PolygonSymbolizer>
    </se:Rule>
    <se:Rule>
      ${filter}
      <se:MaxScaleDenominator>20000</se:MaxScaleDenominator>
      <se:MinScaleDenominator>10000</se:MinScaleDenominator>
      <se:PolygonSymbolizer>
        <Stroke>
          <se:SvgParameter name="stroke"
            >${formatColor("#000")}</se:SvgParameter
          >
          <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
          <se:SvgParameter name="stroke-width">0.25</se:SvgParameter>
        </Stroke>
      </se:PolygonSymbolizer>
    </se:Rule>
    <se:Rule>
      ${filter}
      <se:MaxScaleDenominator>10000</se:MaxScaleDenominator>
      <se:MinScaleDenominator>4000</se:MinScaleDenominator>
      <se:PolygonSymbolizer>
        <Stroke>
          <se:SvgParameter name="stroke"
            >${formatColor("#000")}</se:SvgParameter
          >
          <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
          <se:SvgParameter name="stroke-width">0.5</se:SvgParameter>
        </Stroke>
      </se:PolygonSymbolizer>
    </se:Rule>
    <se:Rule>
      ${filter}
      <se:MaxScaleDenominator>4000</se:MaxScaleDenominator>
      <se:PolygonSymbolizer>
        <Stroke>
          <se:SvgParameter name="stroke"
            >${formatColor("#000")}</se:SvgParameter
          >
          <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
          <se:SvgParameter name="stroke-width">0.75</se:SvgParameter>
        </Stroke>
      </se:PolygonSymbolizer>
    </se:Rule>
  `,
];

const generateRuleForYearRange = ({
  name,
  yearMin,
  yearMax,
  color,
  formatColor,
}: {
  name: string;
  yearMin: number;
  yearMax: number;
  color: string;
  formatColor: FormatColor;
}) => html`
  <se:Rule>
    <se:Name>${name}</se:Name>
    <se:Description>
      <se:Title>${name}</se:Title>
    </se:Description>
    <ogc:Filter>
      <ogc:And>
        <ogc:PropertyIsGreaterThanOrEqualTo>
          <ogc:PropertyName>r_year_int</ogc:PropertyName>
          <ogc:Literal>${yearMin}</ogc:Literal>
        </ogc:PropertyIsGreaterThanOrEqualTo>
        <ogc:PropertyIsLessThan>
          <ogc:PropertyName>r_year_int</ogc:PropertyName>
          <ogc:Literal>${yearMax}</ogc:Literal>
        </ogc:PropertyIsLessThan>
      </ogc:And>
    </ogc:Filter>
    <se:PolygonSymbolizer>
      <se:Fill>
        <se:SvgParameter name="fill">${formatColor(color)}</se:SvgParameter>
      </se:Fill>
      <Stroke>
        <se:SvgParameter name="stroke">${formatColor(color)}</se:SvgParameter>
        <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
        <se:SvgParameter name="stroke-width">0.25</se:SvgParameter>
      </Stroke>
    </se:PolygonSymbolizer>
  </se:Rule>
`;

const generateFilterForGeoraphicContextCategory = (category: string) => html`
  <ogc:Filter>
    <ogc:PropertyIsEqualTo>
      <ogc:PropertyName>category</ogc:PropertyName>
      <ogc:Literal>${category}</ogc:Literal>
    </ogc:PropertyIsEqualTo>
  </ogc:Filter>
`;

const generateRulesForGeographicContextAreas = ({
  formatColor,
}: {
  formatColor: FormatColor;
  opacity?: number;
}) =>
  ([
    ["geographicContextExtent", geographicContextStyling.backgroundColor],
    ["water", geographicContextStyling.waterColor],
    ["wetland", geographicContextStyling.wetlandColor],
  ] as const).map(
    ([category, color]) =>
      // Adding thin stroke prevents subtle gaps between parts of rivers and lakes caused by geometry simplification
      html`
        <se:Rule>
          ${generateFilterForGeoraphicContextCategory(category)}
          <se:PolygonSymbolizer>
            <Fill>
              <se:SvgParameter name="fill"
                >${formatColor(color)}</se:SvgParameter
              >
            </Fill>
            <Stroke>
              <se:SvgParameter name="stroke"
                >${formatColor(color)}</se:SvgParameter
              >
              <se:SvgParameter name="stroke-width">.3</se:SvgParameter>
            </Stroke>
          </se:PolygonSymbolizer>
        </se:Rule>
      `,
  );

const generateRulesForGeographicContextWays = ({
  opacity = 1,
  formatColor,
}: {
  formatColor: FormatColor;
  opacity?: number;
}) =>
  ([
    ["waterway", geographicContextStyling.waterColor],
    ["roadway", geographicContextStyling.roadColor],
    ["railway", geographicContextStyling.railColor],
  ] as const).map(
    ([category, color]) =>
      html`
        <se:Rule>
          ${generateFilterForGeoraphicContextCategory(category)}
          <se:LineSymbolizer uom="http://www.opengeospatial.org/se/units/metre">
            <Stroke>
              <se:SvgParameter name="stroke"
                >${formatColor(color)}</se:SvgParameter
              >
              <se:SvgParameter name="stroke-opacity"
                >${opacity}</se:SvgParameter
              >
              <se:SvgParameter name="stroke-linecap">round</se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin">round</se:SvgParameter>
              <se:SvgParameter name="stroke-width"
                ><ogc:Mul>
                  <ogc:PropertyName
                    >${_.snakeCase("relativeSize")}</ogc:PropertyName
                  >
                  <ogc:Literal>15</ogc:Literal>
                </ogc:Mul></se:SvgParameter
              >
            </Stroke>
          </se:LineSymbolizer>
        </se:Rule>
      `,
  );

const generateYearLabelRule = ({
  minScaleDenominator,
  maxScaleDenominator,
  buildingArea,
}: {
  minScaleDenominator: number;
  maxScaleDenominator: number;
  buildingArea: number;
}) => html`
  <se:Rule>
    <se:MinScaleDenominator>${minScaleDenominator}</se:MinScaleDenominator>
    <se:MaxScaleDenominator>${maxScaleDenominator}</se:MaxScaleDenominator>
    <ogc:Filter>
      <ogc:PropertyIsGreaterThanOrEqualTo>
        <ogc:Function name="area">
          <ogc:PropertyName>geom</ogc:PropertyName>
        </ogc:Function>
        <Literal>${buildingArea}</Literal>
      </ogc:PropertyIsGreaterThanOrEqualTo>
    </ogc:Filter>
    <se:TextSymbolizer>
      <se:Label>
        <ogc:PropertyName>r_year_int</ogc:PropertyName>
      </se:Label>
      <Halo>
        <Radius>.6</Radius>
        <Fill>
          <se:SvgParameter name="fill">#000</se:SvgParameter>
          <se:SvgParameter name="fill-opacity">0.5</se:SvgParameter>
        </Fill>
      </Halo>
      <se:Font>
        <se:SvgParameter name="font-family">Arial</se:SvgParameter>
        <se:SvgParameter name="font-size">11</se:SvgParameter>
        <se:SvgParameter name="font-style">normal</se:SvgParameter>
        <se:SvgParameter name="font-weight">bold</se:SvgParameter>
      </se:Font>
      <se:Geometry>
        <ogc:Function name="interiorPoint">
          <ogc:PropertyName>geom</ogc:PropertyName>
        </ogc:Function>
      </se:Geometry>
      <LabelPlacement>
        <PointPlacement>
          <AnchorPoint>
            <AnchorPointX>0.5</AnchorPointX>
            <AnchorPointY>0.5</AnchorPointY>
          </AnchorPoint>
        </PointPlacement>
      </LabelPlacement>
      <Fill>
        <se:SvgParameter name="fill">#fff</se:SvgParameter>
        <se:SvgParameter name="fill-opacity">0.8</se:SvgParameter>
      </Fill>
      <VendorOption name="autoWrap">60</VendorOption>
      <VendorOption name="maxDisplacement">150</VendorOption>
    </se:TextSymbolizer>
  </se:Rule>
`;

const generateYearLabelRules = () =>
  [
    // Building area units are off from square meters by a factor of ≈2-3 (not sure why).
    // E.g. 1200 is about 500 m²
    {
      minScaleDenominator: 0,
      maxScaleDenominator: 2000,
      buildingArea: 0, // All buildings
    },
    {
      minScaleDenominator: 2001,
      maxScaleDenominator: 4000,
      buildingArea: 200, // Most private houses
    },
    {
      minScaleDenominator: 4001,
      maxScaleDenominator: 8000,
      buildingArea: 1200, // Most blocks of flats
    },
  ].map((payload) => generateYearLabelRule(payload));

const generateMkrfHighlightRules = () => html`
  <se:Rule>
    <se:MaxScaleDenominator>15000</se:MaxScaleDenominator>
    <ogc:Filter>
      <ogc:Not>
        <ogc:PropertyIsNull>
          <ogc:PropertyName>r_mkrf</ogc:PropertyName>
        </ogc:PropertyIsNull>
      </ogc:Not>
    </ogc:Filter>
    <se:LineSymbolizer uom="http://www.opengeospatial.org/se/units/metre">
      <se:PerpendicularOffset
        ><ogc:Add
          ><ogc:Mul>
            <ogc:Function name="env">
              <ogc:Literal>wms_scale_denominator</ogc:Literal>
            </ogc:Function>
            <ogc:Literal>-0.0001</ogc:Literal> </ogc:Mul
          ><ogc:Literal>-0.5</ogc:Literal></ogc:Add
        ></se:PerpendicularOffset
      >
      <Stroke>
        <se:SvgParameter name="stroke-linecap">butt</se:SvgParameter>
        <se:SvgParameter name="stroke-linejoin">bevel</se:SvgParameter>
        <se:SvgParameter name="stroke-width"
          ><ogc:Add
            ><ogc:Mul>
              <ogc:Function name="env">
                <ogc:Literal>wms_scale_denominator</ogc:Literal>
              </ogc:Function>
              <ogc:Literal>0.0002</ogc:Literal> </ogc:Mul
            ><ogc:Literal>1</ogc:Literal></ogc:Add
          ></se:SvgParameter
        >
        <se:SvgParameter name="stroke">#ff0</se:SvgParameter>
        <se:SvgParameter name="stroke-opacity">0.2</se:SvgParameter>
      </Stroke>
    </se:LineSymbolizer>
  </se:Rule>
`;

const formatSld = (rawSld: string): string =>
  rawSld.trimLeft().replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();

const command: Command = async ({ logger }) => {
  logger.log(chalk.bold("results: Generating Geosemantica layer styles"));

  // TODO: Bring back normal import after migrating to ESM & remove formatColor from function payloads
  const { color: d3Color } = (await dynamicImport(
    "d3-color",
    module,
  )) as typeof import("d3-color");

  const formatColor: FormatColor = (color) =>
    d3Color(color)?.formatHex() ?? "#000";

  process.stdout.write(chalk.green("Creating sld styles..."));

  const posterConfig = extractPosterConfig(
    await getTerritoryConfig(),
    await getTerritoryExtent(),
  );

  const legendEntries = extractLegendEntries(posterConfig);

  const buildingsLayerRules: string[] = generateBaseBuildingRules({
    formatColor,
  });

  legendEntries.forEach((entry, index) => {
    const nextEntry = legendEntries[index + 1];
    const entryName = nextEntry
      ? `${entry.completionYear}...${nextEntry.completionYear - 1}`
      : `${entry.completionYear}+`;

    buildingsLayerRules.push(
      generateRuleForYearRange({
        name: entryName,
        color: entry.color,
        yearMin: entry.completionYear,
        yearMax: nextEntry?.completionYear ?? 10000,
        formatColor,
      }),
    );
  });

  buildingsLayerRules.push(
    ...(yearLabelsWhenZoomedIn ? generateYearLabelRules() : []),
    generateMkrfHighlightRules(),
  );

  const backgroundLevelSld = formatSld(
    generateSld({
      rules: [
        ...generateBaseBuildingRules({
          filter: generateFilterForGeoraphicContextCategory("building"),
          formatColor,
        }),
        ...generateRulesForGeographicContextAreas({ formatColor }),
        ...generateRulesForGeographicContextWays({ formatColor }),
      ],
    }),
  );

  const buildingsLayerSld = formatSld(
    generateSld({
      rules: buildingsLayerRules,
    }),
  );

  const foregroundLayerSld = formatSld(
    generateSld({
      rules: generateRulesForGeographicContextWays({
        formatColor,
        opacity: geographicContextStyling.foregroundOpacity,
      }),
    }),
  );

  process.stdout.write(` Done.\n`);

  const { COPY_TO_CLIPBOARD: layerStyleToCopy } = cleanEnv({
    COPY_TO_CLIPBOARD: envalid.str<
      "background" | "buildings" | "foreground" | ""
    >({
      choices: ["background", "buildings", "foreground", ""],
      default: "",
    }),
  });

  // TODO: Bring back normal import after migrating to ESM & remove formatColor from function payloads
  const { default: clipboardy } = (await dynamicImport(
    "clipboardy",
    module,
  )) as typeof import("clipboardy");

  if (layerStyleToCopy) {
    clipboardy.writeSync(
      layerStyleToCopy === "background"
        ? backgroundLevelSld
        : layerStyleToCopy === "buildings"
        ? buildingsLayerSld
        : foregroundLayerSld,
    );

    logger.log(
      `The content of your ${layerStyleToCopy} style file has been copied to clipboard.`,
    );
    logger.log("You can paste it directly to https://map.geosemantica.ru.");
  } else {
    process.stdout.write(chalk.green(`Saving...`));

    await ensureTerritoryGitignoreContainsResults();

    const version = generateVersionSuffix();
    const territoryId = getTerritoryId();
    const backgroundLayerStyleFilePath = path.resolve(
      getResultsDirPath(),
      `${territoryId}.geosemantica-layer-style.${version}.background.sld`,
    );
    const buildingsLayerStyleFilePath = path.resolve(
      getResultsDirPath(),
      `${territoryId}.geosemantica-layer-style.${version}.buildings.sld`,
    );
    const foregroundLayerStyleFilePath = path.resolve(
      getResultsDirPath(),
      `${territoryId}.geosemantica-layer-style.${version}.foreground.sld`,
    );

    await fs.ensureDir(getResultsDirPath());
    await fs.writeFile(
      backgroundLayerStyleFilePath,
      backgroundLevelSld,
      "utf8",
    );
    await fs.writeFile(buildingsLayerStyleFilePath, buildingsLayerSld, "utf8");
    await fs.writeFile(
      foregroundLayerStyleFilePath,
      foregroundLayerSld,
      "utf8",
    );

    logger.log(
      ` Result saved to:\n${
        chalk.magenta(backgroundLayerStyleFilePath) //
      }\n${
        chalk.magenta(buildingsLayerStyleFilePath) //
      }\n${
        chalk.magenta(foregroundLayerStyleFilePath) //
      }`,
    );
  }
};

autoStartCommandIfNeeded(command, __filename);

export default command;
