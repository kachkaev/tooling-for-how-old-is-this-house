import { DateTime } from "luxon";
import * as React from "react";
import styled from "styled-components";

import { MixedPropertyVariantsFeatureCollection } from "../../shared/output";
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
  width: 700mm;
  height: 700mm;
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
  buildingCollection: MixedPropertyVariantsFeatureCollection;
  territoryExtent: TerritoryExtent;

  railwayCollection?: OsmFeatureCollection<OsmRailwayGeometry>;
  roadCollection?: OsmFeatureCollection<OsmRoadGeometry>;
  waterObjectCollection?: OsmFeatureCollection<OsmWaterObjectGeometry>;
}

export const Poster: React.VoidFunctionComponent<PosterProps> = ({
  buildingCollection,
  territoryExtent,

  railwayCollection,
  roadCollection,
  waterObjectCollection,
}) => {
  return (
    <Figure>
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
              <GeoMapLayerWithTerritoryExtent
                {...layerProps}
                data={territoryExtent}
              />
              <GeoMapLayerWithBuildingAges
                {...layerProps}
                data={buildingCollection}
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
        культуры РФ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; визуализация: Александр
        Качкаев (kachkaev.ru)
      </Copyright>
    </Figure>
  );
};
