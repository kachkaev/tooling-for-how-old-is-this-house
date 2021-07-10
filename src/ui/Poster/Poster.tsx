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
import {
  GeoMap,
  GeoMapLayerWithBuildingAges,
  GeoMapLayerWithRailways,
  GeoMapLayerWithRoads,
  GeoMapLayerWithTerritoryExtent,
  GeoMapLayerWithWaterObjects,
} from "../shared/geoMaps";
import { GlobalStyle } from "../shared/GlobalStyle";
import { AgeHistogram } from "./AgeHistogram";
import { CropMark } from "./CropMark";
import { ZoomMark } from "./ZoomMark";

const backgroundColor = "#041116";

const Figure = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  overflow: hidden;
  color: rgb(242, 246, 249);
  background: ${backgroundColor};
  position: relative;
  /* -webkit-font-smoothing: antialiased; */

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

const StyledAgeHistogram = styled(AgeHistogram)`
  position: absolute;
`;

// Using two histogram instances avoid raster content because of CSS filters
const StyledAgeHistogramShadow = styled(StyledAgeHistogram)`
  filter: brightness(0) opacity(0.7) blur(2mm)
    drop-shadow(0 0 3mm ${backgroundColor})
    drop-shadow(0 0 3mm ${backgroundColor})
    drop-shadow(0 0 2mm ${backgroundColor})
    drop-shadow(0 0 1mm ${backgroundColor})
    drop-shadow(0 0 1mm ${backgroundColor});
`;

const Copyright = styled.div`
  position: absolute;
  bottom: 12mm;
  line-height: 1.1em;
  text-align: left;
  opacity: 0.3;
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

  const ageHistogramStyle: React.CSSProperties = {
    bottom: `${
      timeline.marginBottomInMillimeters + layout.printerBleedInMillimeters
    }mm`,
    left: `${
      timeline.marginLeftInMillimeters + layout.printerBleedInMillimeters
    }mm`,
    right: `${
      timeline.marginRightInMillimeters + layout.printerBleedInMillimeters
    }mm`,
  };

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
      <StyledAgeHistogramShadow
        style={ageHistogramStyle}
        buildingCollection={buildingCollection}
      />
      <StyledAgeHistogram
        style={ageHistogramStyle}
        buildingCollection={buildingCollection}
      />
      <DraftNotice
        style={{
          top: `${
            timeline.marginLeftInMillimeters + layout.printerBleedInMillimeters
          }mm`,
          right: `${
            timeline.marginLeftInMillimeters + +layout.printerBleedInMillimeters
          }mm`,
        }}
      >
        <DraftNoticeHeader>черновик</DraftNoticeHeader>
        {DateTime.now().toFormat("yyyy-MM-dd")}
      </DraftNotice>
      <DraftNotice2
        style={{
          left: `${
            timeline.marginLeftInMillimeters + layout.printerBleedInMillimeters
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
      <Copyright
        style={{
          left: `${
            timeline.marginLeftInMillimeters + layout.printerBleedInMillimeters
          }mm`,
        }}
      >
        данные: © участники OpenStreetMap, Росреестр, МинЖКХ, Министерство
        культуры РФ, Викигид &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; визуализация:
        Александр Качкаев (kachkaev.ru)
      </Copyright>
      <ZoomMark
        zoomInMillimetersPerKilometer={map.zoomInMillimetersPerKilometer}
        style={{
          position: "absolute",
          right: `${
            timeline.marginRightInMillimeters + layout.printerBleedInMillimeters
          }mm`,
          bottom: "15mm",
        }}
      />
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
