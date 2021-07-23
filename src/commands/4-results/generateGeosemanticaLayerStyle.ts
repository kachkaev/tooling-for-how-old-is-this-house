import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import clipboardy from "clipboardy";
import html from "tagged-template-noop";

import { extractLegendEntries, extractPosterConfig } from "../../shared/poster";
import { getTerritoryConfig, getTerritoryExtent } from "../../shared/territory";

// Using html`` enable Prettier for XML

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

          <!--YEAR_RANGE_RULES-->

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
        </se:FeatureTypeStyle>
      </UserStyle>
    </NamedLayer>
  </StyledLayerDescriptor>
`;

const sldTemplateForYearRangeRule = html`
  <se:Rule>
    <se:Name><!--NAME--></se:Name>
    <se:Description>
      <se:Title><!--TITLE--></se:Title>
    </se:Description>
    <ogc:Filter>
      <ogc:And>
        <ogc:PropertyIsGreaterThanOrEqualTo>
          <ogc:PropertyName>r_year_int</ogc:PropertyName>
          <ogc:Literal><!--YEAR_MIN--></ogc:Literal>
        </ogc:PropertyIsGreaterThanOrEqualTo>
        <ogc:PropertyIsLessThan>
          <ogc:PropertyName>r_year_int</ogc:PropertyName>
          <ogc:Literal><!--YEAR_MAX--></ogc:Literal>
        </ogc:PropertyIsLessThan>
      </ogc:And>
    </ogc:Filter>
    <se:PolygonSymbolizer>
      <se:Fill>
        <se:SvgParameter name="fill"><!--COLOR--></se:SvgParameter>
      </se:Fill>
      <Stroke>
        <se:SvgParameter name="stroke"><!--COLOR--></se:SvgParameter>
        <se:SvgParameter name="stroke-opacity">0.5</se:SvgParameter>
        <se:SvgParameter name="stroke-width">0.25</se:SvgParameter>
      </Stroke>
    </se:PolygonSymbolizer>
  </se:Rule>
`;

export const generateGeosemanticaLayerStyle: Command = async ({ logger }) => {
  const posterConfig = extractPosterConfig(
    await getTerritoryConfig(),
    await getTerritoryExtent(),
  );

  const legendEntries = extractLegendEntries(posterConfig);

  const rules: string[] = legendEntries.map((entry, index) => {
    const nextEntry = legendEntries[index + 1];
    const entryName = nextEntry
      ? `${entry.completionYear}...${nextEntry.completionYear - 1}`
      : `${entry.completionYear}+`;

    return sldTemplateForYearRangeRule
      .replace("<!--NAME-->", entryName)
      .replace("<!--TITLE-->", entryName)
      .replace(/<!--COLOR-->/g, entry.color)
      .replace("<!--YEAR_MIN-->", `${entry.completionYear}`)
      .replace("<!--YEAR_MAX-->", `${nextEntry?.completionYear ?? 10000}`);
  });

  const sld = sldBase
    .replace("<!--YEAR_RANGE_RULES-->", `\n${rules.join("\n")}\n`)
    .trimLeft()
    .replace(/>\s+</g, "><");

  clipboardy.writeSync(sld);

  logger.log("The content of your style file have been copied to clipboard.");
  logger.log("You can paste it directly to https://map.geosemantica.ru.");
  logger.log(
    "Alternatively, save your styles as completion-year.sld and upload the file.",
  );
};

autoStartCommandIfNeeded(generateGeosemanticaLayerStyle, __filename);
