import { DateTime } from "luxon";
import * as React from "react";
import styled from "styled-components";

import {
  GeographicContextFeatureCollection,
  geographicContextStyling,
  splitGeographicContext,
} from "../../shared/geographicContext";
import { MixedPropertyVariantsFeatureCollection } from "../../shared/mixing";
import {
  extractPrinterBleedInMillimeters,
  PosterConfig,
} from "../../shared/poster";
import { TerritoryExtent } from "../../shared/territory";
import { GlobalStyle } from "../shared/GlobalStyle";
import { CropMark } from "./CropMark";
import { generateMapCompletionYearToColor } from "./generateMapCompletionYearToColor";
import { GeoMap } from "./GeoMap";
import { GeoMapLayerWithBuildingCompletionYears } from "./GeoMapLayerWithBuildingCompletionYears";
import { GeoMapLayerWithGeographicContext } from "./GeoMapLayerWithGeographicContext";
import { GeoMapLayerWithTerritoryExtent } from "./GeoMapLayerWithTerritoryExtent";
import { Timeline } from "./Timeline";
import { ZoomMark } from "./ZoomMark";

const Figure = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  overflow: hidden;
  color: rgb(242, 246, 249);
  background: #fff;
  position: relative;

  font-size: 5mm;
  line-height: 1.4em;
`;

const StyledGeoMap = styled(GeoMap)`
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  top: 0;
`;

const Shadow: React.VoidFunctionComponent<{
  children: React.ReactElement<HTMLElement>;
}> = ({ children }) => {
  const shadow = React.cloneElement(children, {
    style: {
      ...children.props.style,
      filter: `brightness(0) opacity(0.7) blur(2mm)
    drop-shadow(0 0 3mm ${geographicContextStyling.backgroundColor})
    drop-shadow(0 0 3mm ${geographicContextStyling.backgroundColor})
    drop-shadow(0 0 2mm ${geographicContextStyling.backgroundColor})
    drop-shadow(0 0 1mm ${geographicContextStyling.backgroundColor})
    drop-shadow(0 0 1mm ${geographicContextStyling.backgroundColor})`,
    },
  });

  return (
    <>
      {shadow}
      {children}
    </>
  );
};

const Footer = styled.div`
  position: absolute;
  bottom: 12mm;
  line-height: 1.2em;
  text-align: left;
  opacity: 0.8;

  a {
    color: inherit;
    text-decoration: none;
    font-weight: bold;
  }

  a:hover {
    border-bottom: 0.1mm solid;
  }
`;

const DraftNotice = styled.div`
  position: absolute;
  font-size: 30mm;
  line-height: 1.2em;
  text-align: right;
  opacity: 1;
  color: rgba(255, 255, 255, 0.15);
  transform: translate(1mm, -15mm);
`;

const DraftNoticeHeader = styled.div`
  font-size: 1.25em;
`;

const DraftNotice2 = styled(DraftNotice)`
  line-height: 1em;
  right: auto;
  top: auto;
  text-align: left;
  transform: translate(-2mm, -35mm);
`;

export interface PosterProps {
  buildingCollection: MixedPropertyVariantsFeatureCollection;
  geographicContext: GeographicContextFeatureCollection;
  posterConfig: PosterConfig;
  territoryExtent: TerritoryExtent;
}

export const Poster: React.VoidFunctionComponent<PosterProps> = ({
  buildingCollection,
  geographicContext,
  posterConfig,
  territoryExtent,
}) => {
  const { colorByCompletionYear, layout, map, timeline } = posterConfig;

  const mapCompletionYearToColor = React.useMemo(
    () =>
      generateMapCompletionYearToColor(
        colorByCompletionYear,
        geographicContextStyling.buildingColor,
      ),
    [colorByCompletionYear],
  );

  const printerBleedInMillimeters = extractPrinterBleedInMillimeters(
    posterConfig,
  );
  const preprint = posterConfig.target === "preprint";

  const timelineStyle: React.CSSProperties = React.useMemo(
    () => ({
      position: "absolute",
      bottom: `${
        timeline.marginBottomInMillimeters + printerBleedInMillimeters
      }mm`,
      left: `${timeline.marginLeftInMillimeters + printerBleedInMillimeters}mm`,
      right: `${
        timeline.marginRightInMillimeters + printerBleedInMillimeters
      }mm`,
    }),
    [
      printerBleedInMillimeters,
      timeline.marginBottomInMillimeters,
      timeline.marginLeftInMillimeters,
      timeline.marginRightInMillimeters,
    ],
  );

  const {
    backgroundFeatureCollection,
    foregroundFeatureCollection,
  } = React.useMemo(() => splitGeographicContext(geographicContext), [
    geographicContext,
  ]);

  return (
    <Figure
      style={{
        width: `${layout.widthInMillimeters + printerBleedInMillimeters * 2}mm`,
        height: `${
          layout.heightInMillimeters + printerBleedInMillimeters * 2
        }mm`,
      }}
    >
      <GlobalStyle />
      <StyledGeoMap {...map}>
        {(layerProps) => {
          return (
            <>
              <GeoMapLayerWithGeographicContext
                {...layerProps}
                data={backgroundFeatureCollection}
              />

              {map.territoryExtentOutline ? (
                <GeoMapLayerWithTerritoryExtent
                  {...layerProps}
                  data={territoryExtent}
                />
              ) : null}

              <GeoMapLayerWithBuildingCompletionYears
                {...layerProps}
                sampleSize={map.buildingSampleSize}
                mapCompletionYearToColor={mapCompletionYearToColor}
                data={buildingCollection}
              />

              <g opacity={geographicContextStyling.foregroundOpacity}>
                <GeoMapLayerWithGeographicContext
                  {...layerProps}
                  data={foregroundFeatureCollection}
                />
              </g>
            </>
          );
        }}
      </StyledGeoMap>
      <Shadow>
        <Timeline
          style={timelineStyle}
          buildingCollection={buildingCollection}
          mapCompletionYearToColor={mapCompletionYearToColor}
          {...timeline}
        />
      </Shadow>
      {preprint ? null : (
        <>
          <Shadow>
            <DraftNotice
              style={{
                top: `${
                  timeline.marginLeftInMillimeters + printerBleedInMillimeters
                }mm`,
                right: `${
                  timeline.marginLeftInMillimeters + +printerBleedInMillimeters
                }mm`,
              }}
            >
              <DraftNoticeHeader>черновик</DraftNoticeHeader>
              {DateTime.now().toFormat("yyyy-MM-dd")}
            </DraftNotice>
          </Shadow>
          <Shadow>
            <DraftNotice2
              style={{
                left: `${
                  timeline.marginLeftInMillimeters + printerBleedInMillimeters
                }mm`,
                bottom: `${
                  timeline.marginBottomInMillimeters + printerBleedInMillimeters
                }mm`,
              }}
            >
              не для
              <br />
              распространения
            </DraftNotice2>
          </Shadow>
          <Shadow>
            <Footer
              style={{
                left: `${
                  timeline.marginLeftInMillimeters + printerBleedInMillimeters
                }mm`,
              }}
            >
              Этот черновик постера создан при помощи{" "}
              <a href="https://github.com/kachkaev/tooling-for-how-old-is-this-house">
                github.com/kachkaev/tooling-for-how-old-is-this-house
              </a>
              . Размеры, цвета и другие параметры задаются в
              territory-config.yml → poster.
              <br />
              После настройки постера свяжитесь с администратором сайта{" "}
              <a href="https://how-old-is-this.house">
                how-old-is-this.house
              </a>{" "}
              и передайте экспортированную ПДФку. В чистовик добавят список
              источников данных и логотип издательства.
              <br />
            </Footer>
          </Shadow>
        </>
      )}

      <Shadow>
        <ZoomMark
          zoomInMillimetersPerKilometer={map.zoomInMillimetersPerKilometer}
          style={{
            position: "absolute",
            right: `${
              timeline.marginRightInMillimeters + printerBleedInMillimeters
            }mm`,
            bottom: "15mm",
          }}
        />
      </Shadow>
      {preprint ? (
        <>
          <CropMark
            corner="topLeft"
            printerBleedInMillimeters={printerBleedInMillimeters}
          />
          <CropMark
            corner="topRight"
            printerBleedInMillimeters={printerBleedInMillimeters}
          />
          <CropMark
            corner="bottomLeft"
            printerBleedInMillimeters={printerBleedInMillimeters}
          />
          <CropMark
            corner="bottomRight"
            printerBleedInMillimeters={printerBleedInMillimeters}
          />
        </>
      ) : null}
    </Figure>
  );
};
