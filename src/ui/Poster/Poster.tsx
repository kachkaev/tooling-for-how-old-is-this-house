import * as turf from "@turf/turf";
import _ from "lodash";
import { DateTime } from "luxon";
import * as React from "react";
import styled from "styled-components";

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

const mapPaddingInMm = {
  top: 20,
  right: 20,
  bottom: 120,
  left: 20,
};

const Figure = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  overflow: hidden;
  color: rgb(242, 246, 249);
  background: #0e0f12;
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

const StyledAgeHistogram = styled(AgeHistogram)`
  position: absolute;
  left: ${mapPaddingInMm.left}mm;
  right: ${mapPaddingInMm.right}mm;
  bottom: 22mm;
`;

const Copyright = styled.div`
  position: absolute;
  left: ${mapPaddingInMm.left + 1}mm;
  bottom: 12mm;
  line-height: 1.1em;
  text-align: left;
  opacity: 0.3;
`;

const DraftNotice = styled.div`
  right: 60mm;
  top: 100mm;
  position: absolute;
  font-size: 40mm;
  line-height: 1.1em;
  text-align: right;
  color: #f03939;
  opacity: 0.15;
`;

const DraftNoticeHeader = styled.div`
  font-size: 1.25em;
`;

const DraftNotice2 = styled(DraftNotice)`
  right: auto;
  top: auto;
  left: ${mapPaddingInMm.left}mm;
  bottom: 100mm;
  text-align: left;
`;

export interface PosterProps {
  posterConfig: PosterConfig;
  buildingCollection: MixedPropertyVariantsFeatureCollection;
  territoryExtent: TerritoryExtent;

  railwayCollection?: OsmFeatureCollection<OsmRailwayGeometry>;
  roadCollection?: OsmFeatureCollection<OsmRoadGeometry>;
  waterObjectCollection?: OsmFeatureCollection<OsmWaterObjectGeometry>;
}

const reverseFraction = (fractionalNumber: number): number => {
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
  const {
    widthInMillimeters,
    heightInMillimeters,
    printerBleedInMillimeters,
    printerCropMarks,
  } = posterConfig.layout;

  const { territoryExtentOutline, buildingSampleSize } = posterConfig.map;

  const sampledBuildingCollection = React.useMemo(
    () =>
      typeof buildingSampleSize === "number" && isFinite(buildingSampleSize)
        ? {
            ...buildingCollection,
            features: _.orderBy(buildingCollection.features, (feature) => {
              const [lon = 0, lat = 0] =
                turf.pointOnFeature(feature).geometry.coordinates ?? [];
              const fraction = reverseFraction(lon) + reverseFraction(lat);

              return fraction;
            }).slice(0, buildingSampleSize),
          }
        : buildingCollection,
    [buildingCollection, buildingSampleSize],
  );

  return (
    <Figure
      style={{
        width: `${widthInMillimeters + printerBleedInMillimeters * 2}mm`,
        height: `${heightInMillimeters + printerBleedInMillimeters * 2}mm`,
      }}
    >
      <GlobalStyle />
      <StyledGeoMap paddingInMm={mapPaddingInMm} extentToFit={territoryExtent}>
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
              {territoryExtentOutline ? (
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
      <StyledAgeHistogram buildingCollection={buildingCollection} />
      <DraftNotice>
        <DraftNoticeHeader>черновик</DraftNoticeHeader>
        {DateTime.now().toFormat("yyyy-MM-dd")}
      </DraftNotice>
      <DraftNotice2>
        не для
        <br />
        распространения
      </DraftNotice2>
      <Copyright>
        данные: © участники OpenStreetMap, Росреестр, МинЖКХ, Министерство
        культуры РФ, Викигид &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; визуализация:
        Александр Качкаев (kachkaev.ru)
      </Copyright>
      {printerBleedInMillimeters && printerCropMarks ? (
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
      ) : undefined}
    </Figure>
  );
};
