import * as turf from "@turf/turf";
import _ from "lodash";
import { DateTime } from "luxon";
import * as React from "react";
import styled from "styled-components";

import { colorBins } from "../../shared/completionDates";
import { MixedPropertyVariantsFeatureCollection } from "../../shared/outputMixing";
import { PosterConfig } from "../../shared/poster";
import {
  OsmFeatureCollection,
  OsmRailwayGeometry,
  OsmRoadGeometry,
  OsmWaterObjectGeometry,
} from "../../shared/sources/osm/types";
import { TerritoryExtent } from "../../shared/territory";
import { GlobalStyle } from "../shared/GlobalStyle";
import { CropMark } from "./CropMark";
import { GeoMap } from "./GeoMap";
import { GeoMapLayerWithBuildingAges } from "./GeoMapLayerWithBuildingAges";
import { GeoMapLayerWithRailways } from "./GeoMapLayerWithRailways";
import { GeoMapLayerWithRoads } from "./GeoMapLayerWithRoads";
import { GeoMapLayerWithTerritoryExtent } from "./GeoMapLayerWithTerritoryExtent";
import { GeoMapLayerWithWaterObjects } from "./GeoMapLayerWithWaterObjects";
import { Timeline } from "./Timeline";
import { ZoomMark } from "./ZoomMark";

const backgroundColor = "#041116";

const Figure = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  overflow: hidden;
  color: rgb(242, 246, 249);
  background: ${backgroundColor};
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
    drop-shadow(0 0 3mm ${backgroundColor})
    drop-shadow(0 0 3mm ${backgroundColor})
    drop-shadow(0 0 2mm ${backgroundColor})
    drop-shadow(0 0 1mm ${backgroundColor})
    drop-shadow(0 0 1mm ${backgroundColor})`,
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
`;

const DraftNotice = styled.div`
  position: absolute;
  font-size: 30mm;
  line-height: 1.2em;
  text-align: right;
  color: ${colorBins[0]![1]};
  opacity: 0.4;
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
  posterConfig: PosterConfig;
  buildingCollection: MixedPropertyVariantsFeatureCollection;
  territoryExtent: TerritoryExtent;

  railwayCollection?: OsmFeatureCollection<OsmRailwayGeometry>;
  roadCollection?: OsmFeatureCollection<OsmRoadGeometry>;
  waterObjectCollection?: OsmFeatureCollection<OsmWaterObjectGeometry>;
}

/**
 * 1.2345 → 54321
 */
const extractNumberDigitsInReverse = (fractionalNumber: number): number => {
  const digits = `${fractionalNumber}`
    .split("")
    .filter((char) => char >= "0" && char <= "9");
  const result = parseInt(digits.reverse().join(""));

  return isFinite(result) ? result : 0;
};

export const Poster: React.VoidFunctionComponent<PosterProps> = ({
  posterConfig,
  buildingCollection,
  territoryExtent,

  railwayCollection,
  roadCollection,
  waterObjectCollection,
}) => {
  const { layout, timeline, map } = posterConfig;

  const sampledBuildingCollection = React.useMemo(
    () =>
      typeof map.buildingSampleSize === "number" &&
      isFinite(map.buildingSampleSize)
        ? {
            ...buildingCollection,
            features: _.orderBy(buildingCollection.features, (feature) => {
              const [lon = 0, lat = 0] =
                turf.pointOnFeature(feature).geometry.coordinates ?? [];
              const pseudoRandomIndex =
                extractNumberDigitsInReverse(lon) +
                extractNumberDigitsInReverse(lat);

              return pseudoRandomIndex;
            }).slice(0, map.buildingSampleSize),
          }
        : buildingCollection,
    [buildingCollection, map.buildingSampleSize],
  );

  const timelineStyle: React.CSSProperties = React.useMemo(
    () => ({
      position: "absolute",
      bottom: `${
        timeline.marginBottomInMillimeters + layout.printerBleedInMillimeters
      }mm`,
      left: `${
        timeline.marginLeftInMillimeters + layout.printerBleedInMillimeters
      }mm`,
      right: `${
        timeline.marginRightInMillimeters + layout.printerBleedInMillimeters
      }mm`,
    }),
    [
      layout.printerBleedInMillimeters,
      timeline.marginBottomInMillimeters,
      timeline.marginLeftInMillimeters,
      timeline.marginRightInMillimeters,
    ],
  );

  return (
    <Figure
      style={{
        width: `${
          layout.widthInMillimeters + layout.printerBleedInMillimeters * 2
        }mm`,
        height: `${
          layout.heightInMillimeters + layout.printerBleedInMillimeters * 2
        }mm`,
      }}
    >
      <GlobalStyle />
      <StyledGeoMap {...map}>
        {(layerProps) => {
          return (
            <>
              {waterObjectCollection ? (
                <GeoMapLayerWithWaterObjects
                  {...layerProps}
                  data={waterObjectCollection}
                />
              ) : undefined}
              {railwayCollection ? (
                <GeoMapLayerWithRailways
                  {...layerProps}
                  data={railwayCollection}
                />
              ) : undefined}
              {roadCollection ? (
                <GeoMapLayerWithRoads {...layerProps} data={roadCollection} />
              ) : undefined}
              {map.territoryExtentOutline ? (
                <GeoMapLayerWithTerritoryExtent
                  {...layerProps}
                  data={territoryExtent}
                />
              ) : null}
              <GeoMapLayerWithBuildingAges
                {...layerProps}
                data={sampledBuildingCollection}
              />
            </>
          );
        }}
      </StyledGeoMap>
      <Shadow>
        <Timeline
          style={timelineStyle}
          buildingCollection={buildingCollection}
          {...timeline}
        />
      </Shadow>
      <Shadow>
        <DraftNotice
          style={{
            top: `${
              timeline.marginLeftInMillimeters +
              layout.printerBleedInMillimeters
            }mm`,
            right: `${
              timeline.marginLeftInMillimeters +
              +layout.printerBleedInMillimeters
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
              timeline.marginLeftInMillimeters +
              layout.printerBleedInMillimeters
            }mm`,
            bottom: `${
              timeline.marginBottomInMillimeters +
              layout.printerBleedInMillimeters
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
              timeline.marginLeftInMillimeters +
              layout.printerBleedInMillimeters
            }mm`,
          }}
        >
          Этот черновик постера создан при помощи{" "}
          <a href="https://github.com/kachkaev/tooling-for-how-old-is-this-house">
            github.com/kachkaev/tooling-for-how-old-is-this-house
          </a>
          .<br />
          Вам надо связаться с администратором сайта{" "}
          <a href="https://how-old-is-this.house">how-old-is-this.house</a> и
          передать экспортированную ПДФ-ку. В чистовик постера добавят список
          источников данных и логотип издательства.
          <br />
        </Footer>
      </Shadow>
      <Shadow>
        <ZoomMark
          zoomInMillimetersPerKilometer={map.zoomInMillimetersPerKilometer}
          style={{
            position: "absolute",
            right: `${
              timeline.marginRightInMillimeters +
              layout.printerBleedInMillimeters
            }mm`,
            bottom: "15mm",
          }}
        />
      </Shadow>
      {layout.printerBleedInMillimeters && layout.printerCropMarks ? (
        <>
          <CropMark
            corner="topLeft"
            printerBleedInMillimeters={layout.printerBleedInMillimeters}
          />
          <CropMark
            corner="topRight"
            printerBleedInMillimeters={layout.printerBleedInMillimeters}
          />
          <CropMark
            corner="bottomLeft"
            printerBleedInMillimeters={layout.printerBleedInMillimeters}
          />
          <CropMark
            corner="bottomRight"
            printerBleedInMillimeters={layout.printerBleedInMillimeters}
          />
        </>
      ) : undefined}
    </Figure>
  );
};
