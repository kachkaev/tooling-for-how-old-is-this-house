import * as React from "react";
import styled from "styled-components";

import { MixedPropertyVariantsFeatureCollection } from "../../shared/output";
import {
  OsmFeatureCollection,
  OsmRoadGeometry,
  OsmWaterObjectGeometry,
} from "../../shared/sources/osm/types";
import { TerritoryExtent } from "../../shared/territory";
import {
  GeoMap,
  GeoMapLayerWithBuildingAges,
  GeoMapLayerWithRoads,
  GeoMapLayerWithTerritoryExtent,
  GeoMapLayerWithWaterObjects,
} from "../shared/geoMaps";
import { GlobalStyle } from "../shared/GlobalStyle";

const Figure = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  overflow: hidden;
  color: rgb(242, 246, 249);
  background: #0e0f12;
  width: 700mm;
  height: 600mm;
  position: relative;
`;

const StyledGeoMap = styled(GeoMap)`
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  top: 0;
`;

export interface FigureWithHouseAgesProps {
  buildingCollection: MixedPropertyVariantsFeatureCollection;
  roadCollection: OsmFeatureCollection<OsmRoadGeometry>;
  territoryExtent: TerritoryExtent;
  waterObjectCollection: OsmFeatureCollection<OsmWaterObjectGeometry>;
}

const pointsInMm = 2.83465;

export const FigureWithHouseAges: React.VoidFunctionComponent<FigureWithHouseAgesProps> = ({
  buildingCollection,
  roadCollection,
  territoryExtent,
  waterObjectCollection,
}) => {
  return (
    <Figure>
      <GlobalStyle />
      buildings: {buildingCollection.features.length}
      <br />
      territory extent: {territoryExtent.geometry.coordinates.length}
      <br />
      roads: {roadCollection.features.length}
      <br />
      water objects: {waterObjectCollection.features.length}
      <StyledGeoMap padding={50 * pointsInMm} extentToFit={territoryExtent}>
        {(layerProps) => {
          return (
            <>
              <GeoMapLayerWithWaterObjects
                {...layerProps}
                data={waterObjectCollection}
              />
              <GeoMapLayerWithRoads {...layerProps} data={roadCollection} />
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
    </Figure>
  );
};
