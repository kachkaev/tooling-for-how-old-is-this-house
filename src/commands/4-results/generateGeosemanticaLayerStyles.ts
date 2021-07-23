import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import clipboardy from "clipboardy";
import * as envalid from "envalid";
import fs from "fs-extra";
import path from "path";
import html from "tagged-template-noop";

import { cleanEnv } from "../../shared/cleanEnv";
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

// Using html`` to enable Prettier for XML

const sldBase = html`
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
          <se:Rule>
            <se:PolygonSymbolizer>
              <Fill>
                <se:SvgParameter name="fill">#3d424a</se:SvgParameter>
              </Fill>
              <Stroke>
                <se:SvgParameter name="stroke">#3d424a</se:SvgParameter>
                <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
                <se:SvgParameter name="stroke-width">0.25</se:SvgParameter>
              </Stroke>
            </se:PolygonSymbolizer>
          </se:Rule>
          <!--{{ CUSTOM_RULES }}-->
        </se:FeatureTypeStyle>
      </UserStyle>
    </NamedLayer>
  </StyledLayerDescriptor>
`;

const sldTemplateForYearRangeRule = html`
  <se:Rule>
    <se:Name><!--{{ NAME }}--></se:Name>
    <se:Description>
      <se:Title><!--{{ TITLE }}--></se:Title>
    </se:Description>
    <ogc:Filter>
      <ogc:And>
        <ogc:PropertyIsGreaterThanOrEqualTo>
          <ogc:PropertyName>r_year_int</ogc:PropertyName>
          <ogc:Literal><!--{{ YEAR_MIN }}--></ogc:Literal>
        </ogc:PropertyIsGreaterThanOrEqualTo>
        <ogc:PropertyIsLessThan>
          <ogc:PropertyName>r_year_int</ogc:PropertyName>
          <ogc:Literal><!--{{ YEAR_MAX }}--></ogc:Literal>
        </ogc:PropertyIsLessThan>
      </ogc:And>
    </ogc:Filter>
    <se:PolygonSymbolizer>
      <se:Fill>
        <se:SvgParameter name="fill"><!--{{ COLOR }}--></se:SvgParameter>
      </se:Fill>
      <Stroke>
        <se:SvgParameter name="stroke"><!--{{ COLOR }}--></se:SvgParameter>
        <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
        <se:SvgParameter name="stroke-width">0.25</se:SvgParameter>
      </Stroke>
    </se:PolygonSymbolizer>
  </se:Rule>
`;

const outlineRuleCollection = html`
  <se:Rule>
    <se:MaxScaleDenominator>20000</se:MaxScaleDenominator>
    <se:MinScaleDenominator>10000</se:MinScaleDenominator>
    <se:PolygonSymbolizer>
      <Stroke>
        <se:SvgParameter name="stroke">#000</se:SvgParameter>
        <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
        <se:SvgParameter name="stroke-width">0.25</se:SvgParameter>
      </Stroke>
    </se:PolygonSymbolizer>
  </se:Rule>
  <se:Rule>
    <se:MaxScaleDenominator>10000</se:MaxScaleDenominator>
    <se:MinScaleDenominator>4000</se:MinScaleDenominator>
    <se:PolygonSymbolizer>
      <Stroke>
        <se:SvgParameter name="stroke">#000</se:SvgParameter>
        <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
        <se:SvgParameter name="stroke-width">0.5</se:SvgParameter>
      </Stroke>
    </se:PolygonSymbolizer>
  </se:Rule>
  <se:Rule>
    <se:MaxScaleDenominator>4000</se:MaxScaleDenominator>
    <se:PolygonSymbolizer>
      <Stroke>
        <se:SvgParameter name="stroke">#000</se:SvgParameter>
        <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
        <se:SvgParameter name="stroke-width">0.75</se:SvgParameter>
      </Stroke>
    </se:PolygonSymbolizer>
  </se:Rule>
`;

const yearLabelRule = html`
  <se:Rule>
    <se:MaxScaleDenominator>4000</se:MaxScaleDenominator>
    <se:TextSymbolizer>
      <se:Label>
        <ogc:PropertyName>r_year_int</ogc:PropertyName>
      </se:Label>
      <Halo>
        <Radius>.5</Radius>
        <Fill>
          <se:SvgParameter name="fill">#fff</se:SvgParameter>
        </Fill>
      </Halo>
      <se:Font>
        <se:SvgParameter name="font-family">Arial</se:SvgParameter>
        <se:SvgParameter name="font-size">12</se:SvgParameter>
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
        <se:SvgParameter name="fill">#000000</se:SvgParameter>
      </Fill>
      <VendorOption name="autoWrap">60</VendorOption>
      <VendorOption name="maxDisplacement">150</VendorOption>
    </se:TextSymbolizer>
  </se:Rule>
`;

const formatSld = (rawSld: string): string =>
  rawSld.trimLeft().replace(/>\s+</g, "><").replace(/\s+/g, " ");

export const generateGeosemanticaLayerStyles: Command = async ({ logger }) => {
  logger.log(chalk.bold("results: Generating Geosemantica layer styles"));

  process.stdout.write(chalk.green("Creating sld styles..."));

  const posterConfig = extractPosterConfig(
    await getTerritoryConfig(),
    await getTerritoryExtent(),
  );

  const legendEntries = extractLegendEntries(posterConfig);

  const mainLayerRules = legendEntries.map((entry, index) => {
    const nextEntry = legendEntries[index + 1];
    const entryName = nextEntry
      ? `${entry.completionYear}...${nextEntry.completionYear - 1}`
      : `${entry.completionYear}+`;

    return sldTemplateForYearRangeRule
      .replace("<!--{{ NAME }}-->", entryName)
      .replace("<!--{{ TITLE }}-->", entryName)
      .replace(/<!--{{ COLOR }}-->/g, entry.color)
      .replace("<!--{{ YEAR_MIN }}-->", `${entry.completionYear}`)
      .replace(
        "<!--{{ YEAR_MAX }}-->",
        `${nextEntry?.completionYear ?? 10000}`,
      );
  });

  mainLayerRules.push(outlineRuleCollection, yearLabelRule);

  const mainSld = formatSld(
    sldBase.replace(
      "<!--{{ CUSTOM_RULES }}-->",
      `\n${mainLayerRules.join("\n")}\n`,
    ),
  );

  const supplementarySld = formatSld(
    sldBase.replace("<!--{{ CUSTOM_RULES }}-->", ``),
  );

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green(`Saving...`));

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();
  const mainLayerStyleFilePath = path.resolve(
    getResultsDirPath(),
    `geosemantica-layer-style.${territoryId}.${version}.main.sld`,
  );
  const supplementaryLayerStyleFilePath = path.resolve(
    getResultsDirPath(),
    `geosemantica-layer-style.${territoryId}.${version}.supplementary.sld`,
  );

  await fs.ensureDir(getResultsDirPath());
  await fs.writeFile(mainLayerStyleFilePath, mainSld, "utf8");
  await fs.writeFile(supplementaryLayerStyleFilePath, supplementarySld, "utf8");

  logger.log(
    ` Result saved to:\n${chalk.magenta(
      mainLayerStyleFilePath,
    )}\n${chalk.magenta(supplementaryLayerStyleFilePath)}`,
  );

  const { COPY_TO_CLIPBOARD: layerStyleToCopy } = cleanEnv({
    COPY_TO_CLIPBOARD: envalid.str<"main" | "supplementary" | "">({
      choices: ["main", "supplementary", ""],
      default: "",
    }),
  });

  if (layerStyleToCopy) {
    clipboardy.writeSync(
      layerStyleToCopy === "main" ? mainSld : supplementarySld,
    );

    logger.log("");
    logger.log(
      `The content of your ${layerStyleToCopy} style file has been copied to clipboard.`,
    );
    logger.log("You can paste it directly to https://map.geosemantica.ru.");
  }
};

autoStartCommandIfNeeded(generateGeosemanticaLayerStyles, __filename);
